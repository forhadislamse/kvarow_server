import express from "express";
import { paymentController } from "./payment.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();

router.post(
  "/",
  auth(),
  // validateRequest(paymentValidation.createSchema),
  paymentController.createPayment
);


router.get("/get-all-payments", auth(), paymentController.getAllPayments);

router.get("/get-my-payments", auth(), paymentController.getMyPayments);

router.post(
  "/create-stripe-account",
  auth(),   // no role
  paymentController.createStripeAccount
);

// Any logged-in user can view dashboard link
router.get(
  "/dashboard-link",
  auth(),
  paymentController.getUserDashboardLink
);

// Only admin can release teacher fund
router.patch(
  "/orders/:orderId/release",
  auth(UserRole.ADMIN),
  paymentController.releaseTeacherFund
);

export const paymentRoutes = router;