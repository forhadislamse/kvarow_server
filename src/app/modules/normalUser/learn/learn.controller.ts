import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { Request, Response } from "express";
import { instructorSkillService } from "../teach/teach.service";
import { GetInstructorsFilters, learnService, RecentSearchService } from "./learn.service";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";

// const getAllInstructorsController = catchAsync(async (req: Request, res: Response) => {
//   const currentUserId = req.user.id;

//   const filters: GetInstructorsFilters = {
//     skillName: req.query.skillName as string,
//     userName: req.query.userName as string,
//     teachingLevel: req.query.teachingLevel as string,
//   };

//   const instructors = await learnService.getAllInstructors(currentUserId, filters);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "All instructors fetched successfully",
//     data: instructors,
//   });
// });

const getAllInstructorsController = catchAsync(async (req: Request, res: Response) => {
  const currentUserId = req.user.id;

  const filters: GetInstructorsFilters = {
    skillName: req.query.skillName as string,
    userName: req.query.userName as string,
    teachingLevel: req.query.teachingLevel as string,
  };

  // Save search keyword to DB
  if (filters.skillName) {
    await RecentSearchService.saveSearch(currentUserId, filters.skillName);
  }

  const instructors = await learnService.getAllInstructors(currentUserId, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All instructors fetched successfully",
    data: instructors,
  });
});

const getRecentSearchController = catchAsync(
  async (req: Request, res: Response) => {
    const currentUserId = req.user.id;

    const recentSearches = await learnService.getRecentSearches(currentUserId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Latest 3 searches fetched successfully",
      data: recentSearches,
    });
  }
);



const searchInstructorsController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id; // authenticated user

    // query params: teachingLevel, teachingMode, priceMin, priceMax
    const instructors = await learnService.searchInstructorsService(userId, req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructors fetched successfully",
      data: instructors,
    });
  }
);

const getInstructorBySkillId = catchAsync(async (req, res) => {
  const currentUserId = req.user.id; // token থেকে
  const { skillId } = req.params;

  const result = await learnService.getInstructorBySkillIdService(
    currentUserId,
    skillId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Instructor details fetched successfully",
    data: result,
  });
});

const sendOrderOffer = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const data = req.body;

  const result = await learnService.sendOrderOffer({ data, studentId });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order created successfully",
    data: result,
  });
});

const getPendingOrders = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user.id;

  const orders = await learnService.getMyPendingOrders(studentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your pending orders fetched successfully",
    data: orders,
  });
});

const getPaidTeachingOrders = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user.id;

  const orders = await learnService.getMyPaidTeachingOrders(instructorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your paid teaching orders fetched successfully",
    data: orders,
  });
});

const respondToOrderController = catchAsync(async (req, res) => {
  const instructorId = req.user.id;
  const { orderId } = req.params;
  const { action } = req.body; // "ACCEPT" or "DENY"

  if (!["ACCEPT", "DENY"].includes(action)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid action");
  }

  const result = await learnService.respondToOrder({ orderId, instructorId, action });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Order ${action === "ACCEPT" ? "accepted" : "denied"} successfully`,
    data: result,
  });
});


const getInstructorByUserIdController = catchAsync(
  async (req: Request, res: Response) => {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    const data = await learnService.getInstructorByUserIdService(currentUserId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructor profile fetched successfully",
      data,
    });
  }
);

const getConfirmedOrdersController = catchAsync(async (req: Request, res: Response) => {
  const orders = await learnService.getConfirmedOrders(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Confirmed orders fetched",
    data: orders,
  });
});

// Cancelled Orders
const getCancelledOrdersController = catchAsync(async (req: Request, res: Response) => {
  const orders = await learnService.getCancelledOrders(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cancelled orders fetched",
    data: orders,
  });
});

export const learnController = {
  getAllInstructorsController,
    searchInstructorsController,
    getInstructorBySkillId,
    sendOrderOffer,
    getInstructorByUserIdController,
    getPendingOrders,
    getPaidTeachingOrders,
    respondToOrderController,
    getConfirmedOrdersController,
    getCancelledOrdersController,
    getRecentSearchController,
};