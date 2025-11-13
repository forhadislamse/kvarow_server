import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import * as bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import crypto from "crypto";
import httpStatus from "http-status";
import { generateOtp } from "../../../helpars/generateOtp";
import emailSender from "../../../shared/brevoMailSender";
import prisma from "../../../shared/prisma";
import { registrationOtpTemplate } from "../../../helpars/template/registrationOtpTemplate";
import { forgotPasswordTemplate } from "../../../helpars/template/forgotPasswordTemplate";
import { SkillLevel } from "@prisma/client";

/* const createUserIntoDb = async (payload: any & { referredId?: string }) => {
  const { email, password, fcmToken } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // Hash password
  if (!password)
    throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
  const hashedPassword = await bcrypt.hash(password, 10);



  // Create the new user
  const newUser = await prisma.user.create({
    data: {
      ...payload,
      email,
      password: hashedPassword,
      fcmToken,
    },
  });

  if (!newUser)
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");

  // Generate OTP
  const otp = Number(crypto.randomInt(1000, 9999));
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: newUser.id },
    data: { otp, otpExpiresAt: otpExpires },
  });

  await emailSender(
    newUser.email,
    registrationOtpTemplate(otp),
    "User Email Verification OTP"
  );

  // Generate JWT token
  const token = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in!
  );

  // Return user info & token
  return {
    user: { ...newUser, password: undefined },
    token,
  };
}; */


/**
 * ✅ User Signup with Interest Auto-Create
 */

const createUserIntoDb = async (payload: any) => {
  const { email, password, fcmToken, interests } = payload;

  // 1️⃣ Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  if (!password) throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");

  // 2️⃣ Validate and prepare interest data first
  const interestData: any[] = [];
  if (Array.isArray(interests) && interests.length > 0) {
    const seenCategories = new Set(); // duplicate category check

    for (const category of interests) {
      const { categoryId, subCategories } = category;
      if (!categoryId) continue;
      if (seenCategories.has(categoryId)) continue; // skip duplicate category
      seenCategories.add(categoryId);

      if (Array.isArray(subCategories) && subCategories.length > 0) {
        for (const sub of subCategories) {
          const { selectedSubCategoryId, skills } = sub;
          if (Array.isArray(skills) && skills.length > 0) {
            for (const skill of skills) {
              const level = skill.skillLevel?.toUpperCase() || "BEGINNER";
              if (!["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(level)) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Invalid skillLevel: ${skill.skillLevel}`);
              }
              interestData.push({
                categoryId,
                selectedSubCategoryId: selectedSubCategoryId || null,
                selectedSkillId: skill.selectedSkillId || null,
                skillLevel: level,
              });
            }
          } else {
            interestData.push({
              categoryId,
              selectedSubCategoryId: selectedSubCategoryId || null,
              selectedSkillId: null,
              skillLevel: "BEGINNER",
            });
          }
        }
      } else {
        interestData.push({
          categoryId,
          selectedSubCategoryId: null,
          selectedSkillId: null,
          skillLevel: "BEGINNER",
        });
      }
    }
  }

  // 3️⃣ All interest data valid ✅, now create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fcmToken: fcmToken || "",
      fullName: payload.fullName || "",
      role: "USER",
    },
  });

  // 4️⃣ Add userId to interest data
  const interestDataWithUserId = interestData.map(item => ({ ...item, userId: newUser.id }));

  // 5️⃣ Save interests one by one safely (v6 compatible)
  for (const item of interestDataWithUserId) {
    try {
      await prisma.userCategoryInterest.create({
        data: item,
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        console.log("Duplicate interest skipped:", item.categoryId);
      } else {
        throw err;
      }
    }
  }

  // 6️⃣ Generate OTP
  const otp = Number(crypto.randomInt(1000, 9999));
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.user.update({
    where: { id: newUser.id },
    data: { otp, otpExpiresAt: otpExpires },
  });

  // 7️⃣ Send OTP email
  await emailSender(
    newUser.email,
    registrationOtpTemplate(otp),
    "User Email Verification OTP"
  );

  // 8️⃣ Generate JWT token
  const token = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in!
  );

  return {
    user: { ...newUser, password: undefined },
    token,
  };
};












// user login service
const loginUser = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData?.email) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found! with this email " + payload.email
    );
  }
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
  }

  if (payload && payload.fcmToken) {
    await prisma.user.update({
      where: { id: userData.id },
      data: { fcmToken: payload.fcmToken },
    });
  }
  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_token_secret as Secret,
    // config.jwt.refresh_token_expires_in as string
    config.jwt.refresh_token_expires_in as string
  );

  const role = userData.role;

  // if(userData.role === "ADMIN" && userData.adminReq !== "APPROVED"){
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Admin request not approved!");
  // }

  // Notification payload
 /*  const notificationPayload = {
    title: "Login Successful",
    body: `Welcome back, ${userData.firstName || ""}!`,
    type: NotificationType.LOGIN_SUCCESS, 
    targetId: userData.id,
    slug: "login-success",
    fcmToken: payload.fcmToken || userData.fcmToken || "",
  };

  try {
    // Send push notification if FCM token exists
    if (notificationPayload.fcmToken) {
      await notificationService.sendNotification(
        notificationPayload.fcmToken,
        notificationPayload,
        userData.id
      );
    }

    // Save notification in DB
    await notificationService.saveNotification(notificationPayload, userData.id);
  } catch (error) {
    console.error("Failed to send or save login notification:", error);
  } */

  return { token: accessToken, refreshToken: refreshToken, role: role };
};

// change password
const changePassword = async (
  userToken: string,
  newPassword: string,
  oldPassword: string
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken?.id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user?.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const result = await prisma.user.update({
    where: {
      id: decodedToken.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return { message: "Password changed successfully" };
};

// forgot password
const forgotPassword = async (payload: { email: string }) => {
  // Fetch user data or throw if not found
  const userData = await prisma.user.findFirstOrThrow({
    where: {
      email: payload.email,
    },
  });

  const otp = generateOtp(4);
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  console.log(payload.email);

  try {
    const html = forgotPasswordTemplate(otp);

    await emailSender(userData.email, html, "Forgot Password OTP");
  } catch (error) {
    console.error(`Failed to send OTP email:`, error);
  }

  // Update the user's OTP and expiration in the database
  await prisma.user.update({
    where: { id: userData.id },
    data: {
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    },
  });

  return {
    otp,
  };
};

// resend otp
const resendOtp = async (email: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const otp = generateOtp(4);
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  try {
    const html = `Here is your new OTP code: ${otp}. It will expire in 5 minutes.`;

    await emailSender(user.email, html, "Resend OTP");
  } catch (error) {
    console.error(`Failed to send OTP email:`, error);
  }

  // Update the user's profile with the new OTP and expiration
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    },
  });

  return { otp };
};

// verify forgot password OTP
const verifyForgotPasswordOtp = async (payload: {
  email: string;
  otp: number;
}) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Check if the OTP is valid and not expired
  if (
    user.otp !== payload.otp ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  return { message: "OTP verification successful" };
};
const verifyEmailOtp = async (payload: {
  email: string;
  otp: number;
}) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Check if email is already verified
  if (user.isVerifyEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified!");
  }

  // Check if the OTP is valid and not expired
  if (
    user.otp !== payload.otp ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  // ✅ UPDATE USER: Mark email as verified + Clear OTP fields
  await prisma.user.update({
    where: { email: payload.email },
    data: {
      isVerifyEmail: true,        
      otp: null,                  
      otpExpiresAt: null,         
    },
    select: {
      id: true,
      fullName: true,
  
      email: true,
      isVerifyEmail: true,
      updatedAt: true,
    }
  });

  return ;
};

// reset password
const resetPassword = async (payload: { password: string; email: string }) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Update the user's password in the database
  await prisma.user.update({
    where: { email: payload.email },
    data: {
      password: hashedPassword, // Update with the hashed password
      otp: 0, // Clear the OTP
      otpExpiresAt: null, // Clear OTP expiration
    },
  });

   // Notification payload
  /* const notificationPayload = {
    title: "Password Reset Successful",
    body: "Your password has been reset successfully. You can now login with your new password.",
    type: NotificationType.PASSWORD_RESET,
    targetId: user.id,
    slug: "password-reset",
    fcmToken: user.fcmToken || "",
  };

  try {
    // Send push notification if token exists
    if (user.fcmToken) {
      await notificationService.sendNotification(user.fcmToken, notificationPayload, user.id);
    }

    // Save notification in DB
    await notificationService.saveNotification(notificationPayload, user.id);
  } catch (error) {
    console.error("Failed to send or save password reset notification:", error);
  } */

  return { message: "Password reset successfully" };
};

// delete user
const deleteUser = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.id !== decodedToken.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this account"
    );
  }

  const deletedUser = await prisma.user.delete({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  return deletedUser;
};

export const AuthServices = {
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyForgotPasswordOtp,
  verifyEmailOtp,
  deleteUser,
  createUserIntoDb,
};
