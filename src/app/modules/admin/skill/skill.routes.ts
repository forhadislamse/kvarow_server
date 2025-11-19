import express from "express";
import auth from "../../../middlewares/auth";
import { skillController } from "./skill.controller";
import { fileUploader } from "../../../../helpars/fileUploader";


const router = express.Router();

router.post("/create", auth(), skillController.createSkill);
router.get("/", skillController.getAllSkills);
router.get("/:id",auth(), skillController.getSkillById);
// router.patch("/:id", auth(), skillController.updateSkill);
router.put(
  "/:id",
  auth(), // ensure user is authenticated
  fileUploader.uploadSingle, // single image file
  skillController.updateSkill
);
router.delete("/:id", auth(), skillController.deleteSkill);

export const skillRoutes = router;
