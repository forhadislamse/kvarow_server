import express from "express";
import auth from "../../../middlewares/auth";
import { learnController } from "./learn.controller";



const router = express.Router();

router.get(
  "/all-instructors",
  auth(),
  learnController.getAllInstructorsController
);

router.get("/search/instructors", auth(),learnController.searchInstructorsController);
router.get("/instructor/:userId", auth(), learnController.getInstructorByUserIdController);

export const learnRoutes = router;