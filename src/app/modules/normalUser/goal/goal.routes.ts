import express from "express";
import auth from "../../../middlewares/auth";
import { goalController } from "./goal.controller";

const router = express.Router();

// 🔹 Create goal
router.post("/create", auth(), goalController.createGoal);

// 🔹 Get all goals for logged-in user
router.get("/", auth(), goalController.getAllGoals);

router.get("/my-goals", auth(), goalController.getMyGoalByTitleAndMonth);

// 🔹 Get single goal by ID
router.get("/:id", auth(), goalController.getGoalById);

// 🔹 Update goal by ID
router.patch("/:id", auth(), goalController.updateGoal);

// 🔹 Delete goal by ID
router.delete("/:id", auth(), goalController.deleteGoal);

export const goalRoutes = router;
