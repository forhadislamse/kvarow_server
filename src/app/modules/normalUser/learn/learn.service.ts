import { SkillLevel, TeachingMode } from "@prisma/client";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiError";
import httpStatus from "http-status";
import { getTransactionId } from "../../../../shared/getTransactionId";



export interface GetInstructorsFilters {
  skillName?: string;
  userName?: string;
  teachingLevel?: string;
}

const getAllInstructors = async (
  currentUserId: string,
  filters: GetInstructorsFilters = {}
) => {
  const { skillName, userName, teachingLevel } = filters;

  // Convert string to enum
  let enumTeachingLevel: SkillLevel | undefined;
  if (teachingLevel) {
    enumTeachingLevel = SkillLevel[teachingLevel.toUpperCase() as keyof typeof SkillLevel];
  }

  const instructors = await prisma.instructorSkill.findMany({
    where: {
      NOT: { userId: currentUserId },

      ...(skillName && {
        skillName: { contains: skillName, mode: "insensitive" },
      }),

      ...(enumTeachingLevel && { teachingLevel: enumTeachingLevel }),

      ...(userName && {
        user: { fullName: { contains: userName, mode: "insensitive" } },
      }),
    },
    include: {
      user: true,
    },
    orderBy: { hourlyRateCents: "desc" },
  });

  return instructors.map((p) => ({
    id: p.id,
    userId: p.userId,
    userName: p.user.fullName,
    skillName: p.skillName,
    teachingLevel: p.teachingLevel,
    educationTraining: p.educationTraining,
    hourlyRateCents: p.hourlyRateCents,
    teachingMode: p.teachingMode,
    availableDays: p.availableDays,
    availabilitySchedule: p.availabilitySchedule,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
};

interface SearchQuery {
  teachingLevel?: string; // Teacher level user wants
  teachingMode?: string;  // ONLINE / IN_PERSON
  priceMin?: string;
  priceMax?: string;
}

const searchInstructorsService = async (
  currentUserId: string,
  query: SearchQuery
) => {
  const { teachingLevel, teachingMode, priceMin, priceMax } = query;

  // 1️⃣ Fetch authenticated user's skillLevel from DB
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { skillLevel: true },
  });

  const userSkillLevel = currentUser?.skillLevel || SkillLevel.BEGINNER;

  // 2️⃣ Convert query params to enums
  const enumTeachingLevel = teachingLevel
    ? SkillLevel[teachingLevel.toUpperCase() as keyof typeof SkillLevel]
    : undefined;

  // teachingMode can be comma-separated string: "ONLINE,IN_PERSON"
  let enumTeachingModeArray: TeachingMode[] | undefined;
  if (teachingMode) {
    enumTeachingModeArray = teachingMode
      .split(",")
      .map((m) => TeachingMode[m.toUpperCase() as keyof typeof TeachingMode]);
  }

  // 3️⃣ Build Prisma filter
  const whereCondition: any = {
    NOT: { userId: currentUserId },
    ...(enumTeachingLevel && { teachingLevel: enumTeachingLevel }),
    ...(enumTeachingModeArray && { teachingMode: { in: enumTeachingModeArray } }),
    ...(priceMin || priceMax
      ? {
          hourlyRateCents: {
            ...(priceMin && { gte: parseInt(priceMin) }),
            ...(priceMax && { lte: parseInt(priceMax) }),
          },
        }
      : {}),
  };

  // 4️⃣ Fetch instructors
  const instructors = await prisma.instructorSkill.findMany({
    where: whereCondition,
    include: { user: true },
    orderBy: { hourlyRateCents: "asc" },
  });

  // 5️⃣ Map response
  return instructors.map((inst) => ({
    id: inst.id,
    userId: inst.userId,
    userName: inst.user.fullName,
    profileImage: inst.user.profileImage,
    professionalName: inst.user.professionalName,
    skillName: inst.skillName,
    teachingLevel: inst.teachingLevel,
    teachingMode: inst.teachingMode,
    hourlyRateCents: inst.hourlyRateCents,
    availableDays: inst.availableDays,
    availabilitySchedule: inst.availabilitySchedule,
    userSkillLevel, // display only
  }));
};

const getInstructorBySkillIdService = async (currentUserId: string, skillId: string) => {
  // 1️⃣ First fetch skill by skillId
  const targetSkill = await prisma.instructorSkill.findUnique({
    where: { id: skillId },
  });

  if (!targetSkill) {
    throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");
  }

  const userId = targetSkill.userId; // we will use this to fetch all skills of that user

  // 2️⃣ Fetch all skills of this instructor
  const skillsData = await prisma.instructorSkill.findMany({
    where: { userId },
    orderBy: { hourlyRateCents: "desc" },
  });

  // 3️⃣ Fetch user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      professionalName: true,
      profileImage: true,
      about: true,
      email: true,
      skillLevel: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // 4️⃣ Skills array (main object list)
  const skills = skillsData.map((s) => ({
    id: s.id,
    skillName: s.skillName,
    teachingLevel: s.teachingLevel,
    hourlyRateCents: s.hourlyRateCents,
    teachingMode: s.teachingMode,
  }));

  // 5️⃣ Separate arrays
  const educationTraining = skillsData.map((s) => s.educationTraining || "");
  const availableDays = skillsData.map((s) => s.availableDays || []);
  const availabilitySchedule = skillsData.map((s) => s.availabilitySchedule || null);

  // 6️⃣ Final response
  return {
    ...user,
    skills,
    educationTraining,
    availableDays,
    availabilitySchedule,
  };
};

const sendOrderOffer = async ({
  data,
  studentId,
}: {
  data: any;
  studentId: string;
}) => {

  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });
  if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

  const { instructorId, skillId, price } = data;

  if (!instructorId || !skillId || !price) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "instructorId, skillId and price are required"
    );
  }

  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
  });
  if (!instructor)
    throw new ApiError(httpStatus.NOT_FOUND, "Instructor not found");

  const skill = await prisma.instructorSkill.findUnique({
    where: { id: skillId },
  });
  if (!skill)
    throw new ApiError(httpStatus.NOT_FOUND, "Instructor skill not found");

  // Generate unique orderId
  let orderId = getTransactionId();
  while (await prisma.order.findUnique({ where: { orderId } })) {
    orderId = getTransactionId();
  }

  // 🟢 3% Admin fee auto calculate
  const adminFeePercent = 3;
  const adminEarnings = (price * adminFeePercent) / 100;

  // 🟢 Instructor receives
  const teacherReceivedAmount = price - adminEarnings;

  // 🟢 Student pays full price
  const userPayAmount = price;

  // Create order
  const result = await prisma.order.create({
    data: {
      orderId,
      price,
      skillId,
      instructorId,
      studentId,

      adminEarnings,
      teacherReceivedAmount,
      userPayAmount,

      status: "PENDING",
      paymentStatus: "PENDING",
      teacherReceiveStatus: "PENDING",
    },
    include: {
      instructor: true,
      student: true,
      skill: true,
    },
  });


  return result;
};


const getInstructorByUserIdService = async (currentUserId: string, userId: string) => {
  // 1️⃣ Fetch all skills
  const skillsData = await prisma.instructorSkill.findMany({
    where: { userId },
    orderBy: { hourlyRateCents: "desc" },
  });

  if (!skillsData.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "Instructor skills not found");
  }

  // 2️⃣ Fetch user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      professionalName: true,
      profileImage: true,
      about: true,
      email: true,
      skillLevel: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // 3️⃣ Map main skill info into skills array
  const skills = skillsData.map((s) => ({
    skillName: s.skillName,
    teachingLevel: s.teachingLevel,
    hourlyRateCents: s.hourlyRateCents,
    teachingMode: s.teachingMode,
    educationTraining: s.educationTraining,
    availableDays: s.availableDays,
    availabilitySchedule: s.availabilitySchedule,

  }));

  // 4️⃣ Map other arrays separately
  // const educationTraining = skillsData.map((s) => s.educationTraining || "");
  // const availableDays = skillsData.map((s) => s.availableDays || []);
  // const availabilitySchedule = skillsData.map((s) => s.availabilitySchedule || null);

  return {
    ...user,
    skills,
    // educationTraining,
    // availableDays,
    // availabilitySchedule,
  };
};




export const learnService = {
  getAllInstructors,
searchInstructorsService,
  getInstructorBySkillIdService,
  sendOrderOffer,
    getInstructorByUserIdService,
};