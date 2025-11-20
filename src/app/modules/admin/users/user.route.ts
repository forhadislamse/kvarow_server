import express from "express";
import auth from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { adminUserController } from "./user.controller";



const router = express.Router();

// Get all users (admin only)
router.get("/all-users",auth(UserRole.ADMIN), adminUserController.allUsers);
router.patch("/soft-delete/:id", auth(UserRole.ADMIN), adminUserController.softDeleteUser);
router.get("/category-dashboard", auth(UserRole.ADMIN), adminUserController.getCategoryDashboard);


export const adminUserRoutes = router;
