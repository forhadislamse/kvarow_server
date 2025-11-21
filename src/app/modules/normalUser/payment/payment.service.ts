import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiError";
import { PaymentStatus } from "@prisma/client";
import config from "../../../../config";
import { jwtHelpers } from "../../../../helpars/jwtHelpers";
import stripe from "../../../../shared/stripe";

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
};

export const paymentService = {
  createOrderPayment,
    getAllPayments,
    getMyPayments,
    createStripeAccount,  
    getInstructorDashboardLink,
    releaseTeacherFund
};

