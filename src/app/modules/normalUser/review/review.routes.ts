import { Router } from "express";
import { reviewController } from "./review.controller";
import { UserRole } from "@prisma/client";
import auth from "../../../middlewares/auth";

const router = Router();

// Create a new review
router.post(
  "/create",
  auth(),
  reviewController.createReview
);

router.get(
  "/my-reviews",
  auth(), // token required
  reviewController.getMyReceivedReviews
);

// Get all reviews (with optional pagination & filters)
// router.get(
//   "/",
//   auth(),
//   reviewController.getAllReviews
// );

// Get a single review by ID
// router.get(
//   "/:id",
//   auth(),
//   reviewController.getReviewById
// );

// Approve/unapprove a review (admin only)
// router.patch(
//   "/approve/:id",
//   auth(UserRole.ADMIN),
//   reviewController.approveReview
// );

// Delete a review
// router.delete(
//   "/:id",
//   auth(),
//   reviewController.deleteReview
// );

export const reviewRoutes = router;
