import express from "express";
import auth from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { adminUserController } from "./user.controller";



const router = express.Router();

// Get all users (admin only)
router.get("/all-users",auth(UserRole.ADMIN), adminUserController.allUsers);
router.patch("/soft-delete/:id", auth(UserRole.ADMIN), adminUserController.softDeleteUser);
router.get("/category-dashboard", auth(UserRole.ADMIN), adminUserController.getCategoryDashboard);
router.get("/sub-categories", auth(UserRole.ADMIN), adminUserController.subCategoriesTable);
router.get("/skills", auth(UserRole.ADMIN), adminUserController.skillsTable);
router.get("/stats", auth(UserRole.ADMIN), adminUserController.getDashboardStats);
router.get("/cancelled-orders", auth(UserRole.ADMIN), adminUserController.getCancelledOrdersController);
router.get("/confirmed-orders", auth(UserRole.ADMIN), adminUserController.getConfirmedOrdersController);



export const adminUserRoutes = router;
