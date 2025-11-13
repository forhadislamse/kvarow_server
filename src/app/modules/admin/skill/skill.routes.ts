import express from "express";
import auth from "../../../middlewares/auth";
import { skillController } from "./skill.controller";


const router = express.Router();

router.post("/create", auth(), skillController.createSkill);
router.get("/", auth(), skillController.getAllSkills);
router.get("/:id",auth(), skillController.getSkillById);
router.patch("/:id", auth(), skillController.updateSkill);
router.delete("/:id", auth(), skillController.deleteSkill);

export const skillRoutes = router;
