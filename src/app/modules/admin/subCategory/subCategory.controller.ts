import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import { subCategoryService } from "./subCategory.services";
import sendResponse from "../../../../shared/sendResponse";


const createSubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await subCategoryService.createSubCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "SubCategory created successfully",
    data: result,
  });
});

const getAllSubCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await subCategoryService.getAllSubCategories();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubCategories fetched successfully",
    data: result,
  });
});

const getSubCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await subCategoryService.getSubCategoryById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubCategory fetched successfully",
    data: result,
  });
});

const updateSubCategory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const result = await subCategoryService.updateSubCategory(req.params.id, req.body, userId, userRole);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubCategory updated successfully",
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const result = await subCategoryService.deleteSubCategory(req.params.id, userId, userRole);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubCategory deleted successfully",
    data: result,
  });
});

export const subCategoryController = {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
};
