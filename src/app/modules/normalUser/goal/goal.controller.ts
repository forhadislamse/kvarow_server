import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { goalServices } from "./goal.services";


const createGoal = catchAsync(async (req: Request, res: Response) => {
  const result = await goalServices.createGoal(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Goal created successfully",
    data: result,
  });
});

const getAllGoals = catchAsync(async (req: Request, res: Response) => {
  const result = await goalServices.getAllGoals(req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Goals fetched successfully",
    data: result,
  });
});

const getMyGoalByTitleAndMonth = catchAsync(async (req: Request, res: Response) => {
  const { title, month } = req.query as { title?: string; month?: string };

  const result = await goalServices.getMyGoalByTitleAndMonth(req.user.id, title!, month!);
  let message = "All goals fetched successfully";

  if (title && month) {
    message = `My ${title} goals on ${month} fetched successfully`;
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message,
    data: result,
  });
});


const getGoalById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await goalServices.getGoalById(req.user.id, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Goal fetched successfully",
    data: result,
  });
});

const updateGoal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await goalServices.updateGoal(req.user.id, id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Goal updated successfully",
    data: result,
  });
});

const deleteGoal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await goalServices.deleteGoal(id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Goal deleted successfully",
    data: result,
  });
});

export const goalController = {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  getMyGoalByTitleAndMonth
};
