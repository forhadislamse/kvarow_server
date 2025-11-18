import { Request, Response } from "express";
import httpStatus from "http-status";
import { skillService } from "./skill.services";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";


const createSkill = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user.role; // Admin-only check

  const result = await skillService.createSkill(userRole, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Skill created successfully",
    data: result,
  });
});



const getAllSkills= catchAsync(async (req: Request, res: Response) => {
  const singleSearch = req.query.singleSearch as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await skillService.getAllSkills(singleSearch, search);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Skills fetched successfully",
    data: result,
  });
});

const getSkillById = catchAsync(async (req: Request, res: Response) => {
  const result = await skillService.getSkillById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Skill fetched successfully",
    data: result,
  });
});
const updateSkill = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user.role;

  const result = await skillService.updateSkill(req.params.id, req.body, userRole);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Skill updated successfully",
    data: result,
  });
});

const deleteSkill = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user.role;

  const result = await skillService.deleteSkill(req.params.id, userRole);

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
