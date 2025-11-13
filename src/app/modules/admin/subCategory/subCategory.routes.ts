import express from "express";
import auth from "../../../middlewares/auth";
import { subCategoryController } from "./subCategory.controller";


const router = express.Router();

router.post("/create", auth(), subCategoryController.createSubCategory);
router.get("/",auth(), subCategoryController.getAllSubCategories);
router.get("/:id",auth(), subCategoryController.getSubCategoryById);
router.patch("/:id", auth(), subCategoryController.updateSubCategory);
router.delete("/:id", auth(), subCategoryController.deleteSubCategory);

export const subCategoryRoutes = router;
