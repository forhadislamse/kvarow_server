import express from "express";
import { categoryController } from "./category.controller";
import auth from "../../../middlewares/auth";

const router = express.Router();

// 🔹 Create category (anyone can create: user/admin)
router.post("/create",auth(), categoryController.createCategory);

// 🔹 Get all categories
router.get("/", categoryController.getAllCategories);

// 🔹 Get single category by ID
router.get("/:id",  auth(), categoryController.getCategoryById);

// 🔹 Update category (auth required)
router.patch("/:id", auth(), categoryController.updateCategory);

// 🔹 Delete category (auth required)
router.delete("/:id", auth(), categoryController.deleteCategory);

export const categoryRoutes = router;