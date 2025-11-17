import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";

import { fileUploadRoutes } from "../modules/fileUpload/fileUpload.routes";
import { categoryRoutes } from "../modules/admin/category/category.routes";
import { subCategoryRoutes } from "../modules/admin/subCategory/subCategory.routes";
import { skillRoutes } from "../modules/admin/skill/skill.routes";
import { goalRoutes } from "../modules/normalUser/goal/goal.routes";
import { instructorSkillRoutes } from "../modules/normalUser/teach/teach.routes";
import { learnRoutes } from "../modules/normalUser/learn/learn.routes";
import { reviewRoutes } from "../modules/normalUser/review/review.routes";
import { adminUserRoutes } from "../modules/admin/users/user.route";
// import { userCategoryInterestRoutes } from "../modules/admin/userCategoryInterest/userCategoryInterest.routes";

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
    path: "/admin-users",
    route: adminUserRoutes,
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
  // {
  //   path: "/user-category-interests",
  //   route: userCategoryInterestRoutes,
  // },
  {
    path: "/file-uploads",
    route: fileUploadRoutes,
  },
  {
    path: "/uploads",
    route: fileUploadRoutes,
  },
  {
    path: "/goals",
    route: goalRoutes,
  },
  {
    path: "/teaches",
    route: instructorSkillRoutes,
  },
  {
    path: "/learn",
    route: learnRoutes,
  },
  {
    path: "/reviews",
    route: reviewRoutes,
  },

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
