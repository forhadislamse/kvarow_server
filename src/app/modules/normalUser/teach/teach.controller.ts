import { Request, Response } from "express";

import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { instructorSkillService } from "./teach.service";


const createInstructorSkill = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await instructorSkillService.createInstructorSkill(
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Instructor profile created successfully",
    data: result,
  });
});

const getMyInstructorSkills = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await instructorSkillService.getMyInstructorSkills(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My teaching profiles fetched successfully",
    data: result,
  });
});

const getInstructorSkillById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await instructorSkillService.getInstructorSkillById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor profile fetched successfully",
    data: result,
  });
});

const updateInstructorSkill = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await instructorSkillService.updateInstructorSkill(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor profile updated successfully",
    data: result,
  });
});

const deleteInstructorSkill = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await instructorSkillService.deleteInstructorSkill(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor profile deleted successfully",
    data: result,
  });
});

export const instructorSkillController = {
  createInstructorSkill,
  getMyInstructorSkills,
  getInstructorSkillById,
  updateInstructorSkill,
  deleteInstructorSkill,
};
