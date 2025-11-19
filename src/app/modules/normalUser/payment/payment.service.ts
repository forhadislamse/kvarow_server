import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiError";
import { PaymentStatus } from "@prisma/client";

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

export const paymentService = {
  createOrderPayment,
    getAllPayments,
    getMyPayments
};

