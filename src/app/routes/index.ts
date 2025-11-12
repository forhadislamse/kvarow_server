import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";

import { fileUploadRoutes } from "../modules/fileUpload/fileUpload.routes";

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
    path: "/admin/categories",
    route: userRoutes,
  },
  {
    path: "/admin/sub-categories",
    route: userRoutes,
  },
  {
    path: "/admin/skills",
    route: userRoutes,
  },
  {
    path: "/admin/skill-levels",
    route: userRoutes,
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
