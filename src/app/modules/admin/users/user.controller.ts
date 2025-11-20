import httpStatus from "http-status";
import sendResponse from "../../../../shared/sendResponse";
import catchAsync from "../../../../shared/catchAsync";
import { Request, Response } from "express";
import { adminUserService } from "./user.service";

const allUsers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = req.query;

  const result = await adminUserService.allUsers(options, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: result,
  });
});

const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const userIdToDelete = req.params.id;
  const adminId = req.user.id;

  const result = await adminUserService.softDeleteUser(userIdToDelete, adminId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User soft deleted successfully",
    data: result,
  });
});

const getCategoryDashboard = catchAsync(async (req, res) => {
  const result = await adminUserService.getCategoryOverview(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category overview retrieved",
    data: result,
  });
});
export const adminUserController = {
  allUsers,
    softDeleteUser,
  getCategoryDashboard,

};