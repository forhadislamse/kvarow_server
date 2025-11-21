import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiError";
import { PaymentStatus } from "@prisma/client";
import config from "../../../../config";
import { jwtHelpers } from "../../../../helpars/jwtHelpers";
import stripe from "../../../../shared/stripe";
import type Stripe from "stripe";

const createOrderPayment = async ({
  orderId,
  studentId,
  paymentMethod = "CARD",
}: {
  orderId: string;
  studentId: string;
  paymentMethod?: string;
}) => {

  // 1️⃣ Check order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  // 2️⃣ Take final amount from order
  const amount = Number(order.userPayAmount);

  if (!amount || amount <= 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Order does not have a valid userPayAmount"
    );
  }

  // 3️⃣ Stripe amount from frontend will match this
  const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 4️⃣ Create payment record
  const payment = await prisma.payment.create({
    data: {
      orderId,
      userId: studentId,
      amount, // final payable amount
      paymentMethod,
      paymentGateway: "STRIPE",
      status: PaymentStatus.COMPLETED,
      transactionId,
    },
  });

  // 3️⃣ Update Order Status (just like booking update)
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.COMPLETED,
    },
  });

  return {
    message: "Order payment completed",
    payment,
  };
};

const getAllPayments = async (user: { id: string; role: string }) => {
  // ✅ Role check inside service
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can access payments");
  }

  // ✅ DB fetch
  const payments = await prisma.payment.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return payments;
};

const getMyPayments = async (userId: string) => {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

const createStripeAccount = async (token: string) => {
  const decoded = jwtHelpers.verifyToken(token, config.jwt.jwt_secret!);

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new ApiError(404, "User not found");

  const account = await stripe.accounts.create({
    type: "express",
    email: user.email!,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeAccountId: account.id },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${config.client.url}/payment-refresh`,
    return_url: `${config.client.url}/payment-success`,
    type: "account_onboarding",
  });

  return link.url;
};

const getInstructorDashboardLink = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.stripeAccountId) {
    throw new ApiError(400, "Stripe account not found");
  }

  const login = await stripe.accounts.createLoginLink(user.stripeAccountId);

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountUrl: login.url },
  });

  return login.url;
};
/* const releaseTeacherFund = async (orderId: string, adminId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw new ApiError(404, "Order not found");

  if (order.teacherReceiveStatus === PaymentStatus.COMPLETED)
    throw new ApiError(400, "Funds already released");

  const instructor = await prisma.user.findUnique({
    where: { id: order.instructorId },
  });

  if (!instructor?.stripeAccountId)
    throw new ApiError(400, "Instructor Stripe account not found");

  const transfer = await stripe.transfers.create({
    amount: Math.round(order.teacherReceivedAmount! * 100),
    currency: "usd",
    destination: instructor.stripeAccountId,
    metadata: { orderId, releasedBy: adminId },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { teacherReceiveStatus: PaymentStatus.COMPLETED },
  });

  return {
    message: "Instructor earning released",
    transfer,
  };
}; */

const releaseTeacherFund = async (orderId: string, adminId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw new ApiError(404, "Order not found");

  if (order.teacherReceiveStatus === PaymentStatus.COMPLETED)
    throw new ApiError(400, "Funds already released");

  const instructor = await prisma.user.findUnique({
    where: { id: order.instructorId },
  });

  if (!instructor?.stripeAccountId)
    throw new ApiError(400, "Instructor Stripe account not found");

  // 1️⃣ Retrieve connected account
  const connectedAccount = await stripe.accounts.retrieve(
    instructor.stripeAccountId
  );

  // 2️⃣ Check if transfers capability is active
  const transferCapability = connectedAccount.capabilities?.transfers;

  if (transferCapability !== "active") {
    // If capability was never requested → request it
    await stripe.accounts.update(instructor.stripeAccountId, {
      capabilities: {
        transfers: { requested: true },
      },
    });

    throw new ApiError(
      400,
      "Instructor Stripe account is not ready to receive transfers. Capability requested — instructor must complete onboarding."
    );
  }

  // 3️⃣ Create the transfer
  const transfer = await stripe.transfers.create({
    amount: Math.round(order.teacherReceivedAmount! * 100),
    currency: "usd",
    destination: instructor.stripeAccountId,
    metadata: { orderId, releasedBy: adminId },
  });

  // 4️⃣ Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { teacherReceiveStatus: PaymentStatus.COMPLETED },
  });

  return {
    message: "Instructor earning released",
    transfer,
  };
};

const getRefundedPayments = async (
  userId: string,
  query: any
) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  // Base filter
  const where: any = {
    status: PaymentStatus.REFUNDED,
  };

  // Filter by user → student বা instructor যারাই refund request করেছে
  where.userId = userId;

  // Date range filter
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Total count
  const total = await prisma.payment.count({ where });

  // Main query
  const payments = await prisma.payment.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      order: true, // চাইলে order details পাঠাতে পারো
    },
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
    data: payments,
  };
};

const handleRefundByOrderId = async (userToken: string, orderId: string, reason?: string) => {
  try {
    const decodedToken = jwtHelpers.verifyToken(
      userToken,
      config.jwt.jwt_secret!
    );

    // 1️⃣ Find the order by orderId
    const order = await prisma.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // 2️⃣ If already refunded
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      throw new ApiError(400, "Payment already refunded");
    }

    // 3️⃣ Refund allowed only when order cancelled
    if (order.status !== "CANCELLED") {
      throw new ApiError(400, "Refund only allowed for cancelled orders");
    }

    // 4️⃣ Must be a card payment
    if (order.paymentMethod !== "CARD") {
      throw new ApiError(400, "Refund only supported for CARD payments");
    }

    if (!order.stripePaymentIntentId) {
      throw new ApiError(400, "Stripe payment intent ID missing");
    }

    if (!order.userPayAmount) {
      throw new ApiError(400, "Order userPayAmount is missing");
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: (reason as Stripe.RefundCreateParams.Reason) || "requested_by_customer",
      amount: Math.round(order.userPayAmount * 100), // refund only user paid amount
    } as Stripe.RefundCreateParams);

    // 6️⃣ Update order payment status
    await prisma.order.update({
      where: { orderId },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
      },
    });

    return {
      success: true,
      message: "Payment refunded successfully",
      refundId: refund.id,
    };
  } catch (error) {
    console.error("Refund error:", error);
    throw error;
  }
};


export const paymentService = {
  createOrderPayment,
    getAllPayments,
    getMyPayments,
    createStripeAccount,  
    getInstructorDashboardLink,
    releaseTeacherFund,
    getRefundedPayments,
    handleRefundByOrderId
};

