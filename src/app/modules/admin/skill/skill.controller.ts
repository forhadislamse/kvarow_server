import { Request, Response } from "express";
import httpStatus from "http-status";
import { skillService } from "./skill.services";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";


export const createSkill = catchAsync(async (req: Request, res: Response) => {
  const result = await skillService.createSkill(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Skill created successfully",
    data: result,
  });
});

export const getAllSkills = catchAsync(async (req: Request, res: Response) => {
  const result = await skillService.getAllSkills();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Skills fetched successfully",
    data: result,
  });
});

export const getSkillById = catchAsync(async (req: Request, res: Response) => {
  const result = await skillService.getSkillById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Skill fetched successfully",
    data: result,
  });
});

export const updateSkill = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const result = await skillService.updateSkill(req.params.id, req.body, userId, userRole);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Skill updated successfully",
    data: result,
  });
});

export const deleteSkill = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const result = await skillService.deleteSkill(req.params.id, userId, userRole);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Skill deleted successfully",
    data: result,
  });
});

export const skillController = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
};
