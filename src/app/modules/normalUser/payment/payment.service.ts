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
  stripePaymentIntentId,
}: {
  orderId: string;
  studentId: string;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
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
      stripePaymentIntentId,
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
}; */

const releaseTeacherFund = async (orderId: string, adminId: string) => {
  // 1️⃣ Find the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new ApiError(404, "Order not found");

  if (order.teacherReceiveStatus === PaymentStatus.COMPLETED) {
    throw new ApiError(400, "Funds already released for this order");
  }

  if (!order.teacherReceivedAmount || order.teacherReceivedAmount <= 0) {
    throw new ApiError(400, "Invalid instructor payout amount");
  }

  // 2️⃣ Check if the user is actually an instructor
  const isInstructor = await prisma.instructorSkill.findFirst({
    where: { userId: order.instructorId },
  });

  if (!isInstructor) {
    throw new ApiError(400, "This user is not registered as an instructor");
  }

  // 3️⃣ Fetch instructor user data
  const instructor = await prisma.user.findUnique({
    where: { id: order.instructorId },
  });

  if (!instructor?.stripeAccountId) {
    throw new ApiError(400, "Instructor Stripe account not found");
  }

  // 4️⃣ Retrieve the connected account from Stripe
  const connectedAccount = await stripe.accounts.retrieve(
    instructor.stripeAccountId
  );

  const transferCapability = connectedAccount.capabilities?.transfers;

  // 5️⃣ Ensure transfers capability is active
  if (transferCapability !== "active") {
    // Request capability (needed at least once)
    await stripe.accounts.update(instructor.stripeAccountId, {
      capabilities: {
        transfers: { requested: true },
      },
    });

    throw new ApiError(
      400,
      "Instructor must complete Stripe onboarding before receiving payments."
    );
  }

  // 6️⃣ Create the transfer
  const transfer = await stripe.transfers.create({
    amount: Math.round(order.teacherReceivedAmount * 100), // convert USD → cents
    currency: "usd",
    destination: instructor.stripeAccountId,
    metadata: {
      orderId,
      releasedBy: adminId,
    },
  });

  // 7️⃣ Update order payout status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      teacherReceiveStatus: PaymentStatus.COMPLETED,
    },
  });

  return {
    message: "Instructor earning has been released successfully",
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

/* const handleRefundByOrderId = async (
  adminId: string,
  orderObjectId: string,
  reason?: string
) => {
  // 1️⃣ Find order by order _id
  const order = await prisma.order.findUnique({
    where: { id: orderObjectId },
  });

  if (!order) throw new ApiError(404, "Order not found");

  if (order.paymentStatus === PaymentStatus.REFUNDED)
    throw new ApiError(400, "Payment already refunded");

  if (order.status !== "CANCELLED")
    throw new ApiError(400, "Refund only allowed for cancelled orders");

  if (order.paymentMethod !== "CARD")
    throw new ApiError(400, "Refund only supported for CARD payments");

  // 2️⃣ Find Payment from payment table
  const payment = await prisma.payment.findFirst({
    where: {
      orderId: orderObjectId,
      paymentGateway: "STRIPE",
      status: "COMPLETED",
    },
  });

  if (!payment)
    throw new ApiError(404, "Completed payment record not found");

  if (!payment.paymentMethod)
    throw new ApiError(400, "Payment method missing");

  if (!payment.paymentMethod.startsWith("pm_"))
    throw new ApiError(400, "Invalid Stripe payment method");

  if (!payment.stripePaymentIntentId)
    throw new ApiError(400, "Stripe payment intent ID missing");

  if (!payment.amount)
    throw new ApiError(400, "Payment amount missing");

  // 3️⃣ Stripe Refund
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    reason: (reason as any) || "requested_by_customer",
    amount: Math.round(payment.amount * 100),
  });

  // 4️⃣ Update Order + Payment statuses
  await prisma.order.update({
    where: { id: orderObjectId },
    data: { paymentStatus: PaymentStatus.REFUNDED },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.REFUNDED },
  });

  return {
    success: true,
    message: "Refund processed successfully",
    refundId: refund.id,
  };
}; */

const handleRefundByOrderId = async (
  adminId: string,
  orderObjectId: string,
  reason?: string
) => {
  // 1️⃣ Find order by _id
  const order = await prisma.order.findUnique({
    where: { id: orderObjectId },
  });

  if (!order) throw new ApiError(404, "Order not found");

  if (order.paymentStatus === PaymentStatus.REFUNDED)
    throw new ApiError(400, "Payment already refunded");

  if (order.status !== "CANCELLED")
    throw new ApiError(400, "Refund only allowed for cancelled orders");

  if (order.paymentMethod !== "CARD")
    throw new ApiError(400, "Refund only supported for CARD payments");

  // 2️⃣ Find Payment from payment table
  const payment = await prisma.payment.findFirst({
    where: {
      orderId: orderObjectId,
      paymentGateway: "STRIPE",
      status: PaymentStatus.COMPLETED,
    },
  });

  if (!payment)
    throw new ApiError(404, "Completed payment record not found");

  if (!payment.stripePaymentIntentId)
    throw new ApiError(400, "Stripe payment intent ID missing");

  if (!payment.amount)
    throw new ApiError(400, "Payment amount missing");

  // 3️⃣ Stripe Refund (use Math.floor to avoid over-refund)
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    reason: (reason as any) || "requested_by_customer",
    amount: Math.floor(payment.amount * 100), // convert to cents safely
  });

  // 4️⃣ Update Order + Payment statuses
  await prisma.order.update({
    where: { id: orderObjectId },
    data: { paymentStatus: PaymentStatus.REFUNDED },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.REFUNDED },
  });

  return {
    success: true,
    message: "Refund processed successfully",
    refundId: refund.id,
  };
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

