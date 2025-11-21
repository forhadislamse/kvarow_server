import { Request, Response } from "express";
import catchAsync from "../../../../shared/catchAsync";
import ApiError from "../../../../errors/ApiError";
import httpStatus from "http-status";
import sendResponse from "../../../../shared/sendResponse";
import { paymentService } from "./payment.service";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user.id;
  const { orderId, paymentMethod } = req.body;

  if (!orderId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "orderId is required");
  }

  const result = await paymentService.createOrderPayment({
    orderId,
    studentId,
    paymentMethod,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payment completed successfully",
    data: result,
  });
});


const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user; // JWT middleware থেকে আসে

  const result = await paymentService.getAllPayments({
    id: user.id,
    role: user.role,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments retrieved successfully",
    data: result,
  });
});


const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // token থেকে আসা user id

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await paymentService.getMyPayments(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your payments retrieved successfully",
    data: result,
  });
});

const createStripeAccount = catchAsync(async (req, res) => {
  const url = await paymentService.createStripeAccount(req.headers.authorization!);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Stripe account link generated",
    data: { url },
  });
});

const getUserDashboardLink = catchAsync(async (req, res) => {
  const url = await paymentService.getInstructorDashboardLink(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Stripe dashboard link generated",
    data: url,
  });
});

const releaseTeacherFund = catchAsync(async (req, res) => {
  const transfer = await paymentService.releaseTeacherFund(
    req.params.orderId,
    req.user.id
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Teacher fund released",
    data: transfer,
  });
});

export const paymentController = {
  createPayment,
    getAllPayments, 
    getMyPayments,
    createStripeAccount,  
    getUserDashboardLink,
    releaseTeacherFund

};