import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../../shared/catchAsync";
import { subCategoryService } from "./subCategory.services";
import sendResponse from "../../../../shared/sendResponse";


const createSubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await subCategoryService.createSubCategory(req.user.role, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "SubCategory created successfully",
    data: result,
  });
});



const getAllSubCategories= catchAsync(async (req: Request, res: Response) => {
  const singleSearch = req.query.singleSearch as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await subCategoryService.getAllSubCategories(singleSearch, search);

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
  const userRole = req.user.role;

  const result = await subCategoryService.updateSubCategory(
    req.params.id,
    req.body,
    userRole
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubCategory updated successfully",
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user.role;

  const result = await subCategoryService.deleteSubCategory(
    req.params.id,
    userRole
  );

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
