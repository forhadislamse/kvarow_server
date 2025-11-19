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
export const paymentController = {
  createPayment,
};