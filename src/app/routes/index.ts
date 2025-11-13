import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";

import { fileUploadRoutes } from "../modules/fileUpload/fileUpload.routes";
import { categoryRoutes } from "../modules/admin/category/category.routes";
import { subCategoryRoutes } from "../modules/admin/subCategory/subCategory.routes";
import { skillRoutes } from "../modules/admin/skill/skill.routes";
import { userCategoryInterestRoutes } from "../modules/admin/userCategoryInterest/userCategoryInterest.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/categories",
    route: categoryRoutes,
  },
  {
    path: "/sub-categories",
    route: subCategoryRoutes,
  },
  {
    path: "/skills",
    route: skillRoutes,
  },
  {
    path: "/user-category-interests",
    route: userCategoryInterestRoutes,
  },
  {
    path: "/file-uploads",
    route: fileUploadRoutes,
  },
  {
    path: "/uploads",
    route: fileUploadRoutes,
  },

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
