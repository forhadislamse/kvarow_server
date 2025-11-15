import express from "express";
import auth from "../../../middlewares/auth";
import { instructorSkillController } from "./teach.controller";


const router = express.Router();

// 🔹 Create Instructor Skill (profile)
router.post("/", auth(), instructorSkillController.createInstructorSkill);

// 🔹 Get my profiles
router.get("/my", auth(), instructorSkillController.getMyInstructorSkills);

// 🔹 Get single profile by ID
router.get("/:id", auth(), instructorSkillController.getInstructorSkillById);

// 🔹 Update profile
router.patch("/:id", auth(), instructorSkillController.updateInstructorSkill);

// 🔹 Delete profile
router.delete("/:id", auth(), instructorSkillController.deleteInstructorSkill);

export const instructorSkillRoutes = router;