
// import httpStatus from "http-status";
// import catchAsync from "../../../../shared/catchAsync";
// import { userCategoryInterestService } from "./userCategoryInterest.services";
// import sendResponse from "../../../../shared/sendResponse";


// const createInterest = catchAsync(async (req, res) => {
//   const result = await userCategoryInterestService.createInterest(req.user.id, req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: "Interest created successfully",
//     data: result,
//   });
// });

// const getAllInterests = catchAsync(async (req, res) => {
//   const result = await userCategoryInterestService.getAllInterests(req.user.id, req.user.role);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Interests retrieved successfully",
//     data: result,
//   });
// });

// const getInterestById = catchAsync(async (req, res) => {
//   const result = await userCategoryInterestService.getInterestById(req.params.id, req.user.id, req.user.role);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Interest fetched successfully",
//     data: result,
//   });
// });

// const updateInterest = catchAsync(async (req, res) => {
//   const result = await userCategoryInterestService.updateInterest(req.params.id, req.user.id, req.user.role, req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Interest updated successfully",
//     data: result,
//   });
// });

// const deleteInterest = catchAsync(async (req, res) => {
//   const result = await userCategoryInterestService.deleteInterest(req.params.id, req.user.id, req.user.role);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Interest deleted successfully",
//     data: result,
//   });
// });

// export const userCategoryInterestController = {
//   createInterest,
//   getAllInterests,
//   getInterestById,
//   updateInterest,
//   deleteInterest,
// };
