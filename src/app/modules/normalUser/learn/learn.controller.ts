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
    getInstructorByUserIdController,
};