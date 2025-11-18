import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { Request, Response } from "express";
import { instructorSkillService } from "../teach/teach.service";
import { GetInstructorsFilters, learnService } from "./learn.service";

const getAllInstructorsController = catchAsync(async (req: Request, res: Response) => {
  const currentUserId = req.user.id;

  const filters: GetInstructorsFilters = {
    skillName: req.query.skillName as string,
    userName: req.query.userName as string,
    teachingLevel: req.query.teachingLevel as string,
  };

  const instructors = await learnService.getAllInstructors(currentUserId, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All instructors fetched successfully",
    data: instructors,
  });
});

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

export const learnController = {
  getAllInstructorsController,
    searchInstructorsController,
    getInstructorBySkillId,
    sendOrderOffer,
    getInstructorByUserIdController,
};