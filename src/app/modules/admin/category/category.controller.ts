import httpStatus from "http-status";
import sendResponse from "../../../../shared/sendResponse";
import catchAsync from "../../../../shared/catchAsync";
import { categoryServices } from "./category.services";

// // Create Category (anyone can create: admin or user)
// const createCategory = catchAsync(async (req, res) => {
//   const result = await categoryServices.createCategory(req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: "Category created successfully",
//     data: result,
//   });
// });

const createCategory = catchAsync(async (req, res) => {
  const result = await categoryServices.createCategory(req.user.role, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

// Get all categories
// const getAllCategories = catchAsync(async (req, res) => {
//   const result = await categoryServices.getAllCategories();
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Categories fetched successfully",
//     data: result,
//   });
// });

const getAllCategories = catchAsync(async (req, res) => {
  const search = req.query.search as string | undefined; // optional search query

  const result = await categoryServices.getAllCategories(search);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result,
  });
});

// Get category by ID
const getCategoryById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await categoryServices.getCategoryById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category fetched successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  // user info
  const user = {
    id: req.user.id,
    role: req.user.role,
  };

  const result = await categoryServices.updateCategory(id, req.body, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = {
    id: req.user.id,
    role: req.user.role,
  };

  const result = await categoryServices.deleteCategory(id, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});


export const categoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,  
  updateCategory,
  deleteCategory,   
};