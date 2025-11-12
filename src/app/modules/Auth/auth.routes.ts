import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { checkBlockedStatus } from "../../middlewares/checkBlock";
import multer from "multer";

const router = express.Router();

// Configure multer for user profile updates
const storage = multer.memoryStorage();
const upload = multer({ storage });
const userImageUpload = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "driverLicense", maxCount: 10 },
]);

// user login route
router.post("/register", userImageUpload, AuthController.createUser);

// user login route
router.post("/login", AuthController.loginUser);

// user logout route
router.post("/logout", AuthController.logoutUser);

//change password
router.put(
  "/change-password",
  auth(),
  checkBlockedStatus,
  AuthController.changePassword
);

//reset password
router.post("/reset-password", AuthController.resetPassword);

//forgot password
router.post("/forgot-password", AuthController.forgotPassword);

//resend otp
router.post("/resend-otp", AuthController.resendOtp);

//verify-otp
router.post("/verify-otp", AuthController.verifyForgotPasswordOtp);

//delete user
router.delete("/delete-user", auth(), AuthController.deleteUser);

export const AuthRoutes = router;
