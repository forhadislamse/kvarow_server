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

const getCategoryDashboard = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user.id;

  const options= req.query;

  const result = await adminUserService.getCategoryOverview(adminId, options);

  // Only keep categories table
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Categories dashboard retrieved successfully",
    data: {
      topStats: result.topStats,
      tables: { categories: result.tables.categories },
    },
  });
});

const subCategoriesTable = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user.id;

  const options = req.query;

  const result = await adminUserService.getSubCategoriesTable(adminId, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Sub-categories retrieved successfully",
    data: result,
  });
});

// Skills table API
const skillsTable = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user.id;

  const options = req.query;
  const result = await adminUserService.getSkillsTable(adminId, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Skills retrieved successfully",
    data: result,
  });
});

const getDashboardStats = catchAsync(async (req, res) => {
  const result = await adminUserService.dashboardStats(req.query, req.user?.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard data retrieved successfully",
    data: result,
  });
});

const getCancelledOrdersController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const role = req.user.role;
  const options = req.query;

  const orders = await adminUserService.getCancelledOrders(userId, role, options );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cancelled orders fetched successfully",
    data: orders,
  });
});

const getConfirmedOrdersController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const role = req.user.role;
  const options = req.query;

  const orders = await adminUserService.getConfirmedOrders(userId, role, options );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Confirmed orders fetched successfully",
    data: orders,
  });
});

export const adminUserController = {
  allUsers,
  softDeleteUser,
  getCategoryDashboard,
  subCategoriesTable,
  skillsTable,
  getDashboardStats,
  getCancelledOrdersController,
  getConfirmedOrdersController,
};
