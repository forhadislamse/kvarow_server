
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { reviewService } from "./review.service";
import httpStatus from "http-status";

// Create review
const createReview = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const review = req.body;

  const result = await reviewService.create({ userId, review });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created successfully!",
    data: result,
  });
});

// // Get all reviews
// const getAllReviews = catchAsync(async (req, res) => {
//   const options = req.query;
//   const result = await reviewService.getAllReviews(options);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: "Reviews fetched successfully!",
//     data: result,
//   });
// });

// // Get single review by ID
// const getReviewById = catchAsync(async (req, res) => {
//   const reviewId = req.params.id;
//   const result = await reviewService.getSingleReview(reviewId);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: "Review fetched successfully!",
//     data: result,
//   });
// });

// // Approve / Unapprove review
// // const approveReview = catchAsync(async (req, res) => {
// //   const result = await reviewService.approveReview(req.params.id);

// //   sendResponse(res, {
// //     success: true,
// //     statusCode: httpStatus.OK,
// //     message: "Review approval status updated successfully!",
// //     data: result,
// //   });
// // });

// // Delete review
// const deleteReview = catchAsync(async (req, res) => {
//   const result = await reviewService.remove(req.params.id);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: "Review deleted successfully!",
//     data: result,
//   });
// });

const getMyReceivedReviews = catchAsync(async (req, res) => {
  const instructorId = req.user.id; // logged in instructor

  const result = await reviewService.getReviewsForInstructor(instructorId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "My received reviews fetched successfully!",
    data: result,
  });
});

export const reviewController = {
  createReview,
  getMyReceivedReviews,
  // getAllReviews,
  // getReviewById,
  // approveReview,
  // deleteReview,
};
