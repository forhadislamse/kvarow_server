
import { Goal } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";

/* const createGoal = async (userId: string, payload: any) => {
  if (!payload.title) throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");

  // Collect all goalX fields dynamically
  const specificGoals: string[] = [];
  Object.keys(payload).forEach((key) => {
    if (key.toLowerCase().startsWith("goal") && payload[key]) {
      specificGoals.push(payload[key]);
    }
  });

  return prisma.goal.create({
    data: {
      userId,
      title: payload.title,
      targetMonth: payload.targetMonth ? new Date(payload.targetMonth) : null,
      practiceDurationMinutes: payload.practiceDurationMinutes ?? null,
      specificGoals,
    },
  });
}; */

const createGoal = async (userId: string, payload: any) => {
  if (!payload.title) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
  }

  let specificGoals: string[] = [];

  // If array comes from frontend (recommended)
  if (Array.isArray(payload.specificGoals)) {
    specificGoals = payload.specificGoals;
  } else {
    // If goal1, goal2 ... style comes
    Object.keys(payload).forEach((key) => {
      if (key.toLowerCase().startsWith("goal") && payload[key]) {
        specificGoals.push(payload[key]);
      }
    });
  }

  return prisma.goal.create({
    data: {
      userId,
      title: payload.title,
      targetMonth: payload.targetMonth ? new Date(payload.targetMonth) : null,
      practiceDurationMinutes: payload.practiceDurationMinutes ?? null,
      specificGoals,
    },
  });
};

const getAllGoals = async (userId: string) => {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};


const monthNames: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
  september: 8, october: 9, november: 10, december: 11
};

const getMyGoalByTitleAndMonth = async (
  userId: string,
  title?: string,
  monthName?: string
) => {
  // 1) Base query = User's all goals
  let goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // 2) If title provided → filter by title
  if (title) {
    goals = goals.filter((g) =>
      g.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  // 3) If month provided → convert to month index & filter
  if (monthName) {
    const monthIndex = monthNames[monthName.toLowerCase()];
    if (monthIndex === undefined) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid month name");
    }

    goals = goals.filter(
      (g) => g.targetMonth?.getMonth() === monthIndex
    );
  }

  // 4) Format goals: goal1, goal2, goal3
  const formatted = goals.map((goal) => {
    const obj: any = {
      id: goal.id,
      userId: goal.userId,
      title: goal.title,
      targetMonth: goal.targetMonth,
      practiceDurationMinutes: goal.practiceDurationMinutes,
      createdAt: goal.createdAt,
    };

    goal.specificGoals.forEach((g, i) => {
      obj[`goal${i + 1}`] = g;
    });

    return obj;
  });

  return formatted;
};

const getGoalById = async (userId: string, goalId: string) => {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!goal) throw new ApiError(httpStatus.NOT_FOUND, "Goal not found");
  return goal;
};

const updateGoal = async (userId: string, goalId: string, payload: any) => {
  const existing = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Goal not found");

  // Merge goalX fields
  const updatedGoals: string[] = [];
  Object.keys(payload).forEach((key) => {
    if (key.toLowerCase().startsWith("goal") && payload[key]) {
      updatedGoals.push(payload[key]);
    }
  });

  return prisma.goal.update({
    where: { id: goalId },
    data: {
      title: payload.title ?? existing.title,
      targetMonth: payload.targetMonth ? new Date(payload.targetMonth) : existing.targetMonth,
      practiceDurationMinutes: payload.practiceDurationMinutes ?? existing.practiceDurationMinutes,
      specificGoals: updatedGoals.length > 0 ? updatedGoals : existing.specificGoals,
    },
  });
};

const deleteGoal = async (goalId: string, userId: string) => {
  const existing = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Goal not found");

  await prisma.goal.delete({ where: { id: goalId } });
  return { id: goalId };
};

export const goalServices = {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
    getMyGoalByTitleAndMonth,
};
