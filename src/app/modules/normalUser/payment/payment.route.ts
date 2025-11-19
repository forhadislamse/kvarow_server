import express from "express";
import { paymentController } from "./payment.controller";
import auth from "../../../middlewares/auth";


const router = express.Router();

router.post(
  "/",
  auth(),
  // validateRequest(paymentValidation.createSchema),
  paymentController.createPayment
);


// router.get("/get-all-payments", auth(), paymentController.getAllPayments);

// router.get("/get-my-payments", auth(), paymentController.getMyPayments);

export const paymentRoutes = router;