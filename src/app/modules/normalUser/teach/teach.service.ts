import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";

const createInstructorSkill = async (userId: string, payload: any) => {
  if (!payload.skillName) {
    throw new ApiError(httpStatus.BAD_REQUEST, "skillName is required");
  }

  // check duplicate profile for same user & skill
  const exist = await prisma.instructorSkill.findFirst({
    where: {
      userId,
      skillName: payload.skillName,
    },
  });

  if (exist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Teaching profile already exists for this skill"
    );
  }

  // create profile
  const profile = await prisma.instructorSkill.create({
    data: {
      userId,
      skillName: payload.skillName,
      teachingLevel: payload.teachingLevel,
      educationTraining: payload.educationTraining,
      hourlyRateCents: payload.hourlyRateCents,
      teachingMode: payload.teachingMode,

      availableDays: payload.availableDays || [],

      availabilitySchedule: payload.availabilitySchedule
        ? payload.availabilitySchedule
        : undefined,
    },
  });

  return profile;
};



/* const getMyInstructorSkills = async (userId: string) => {
  // 1️⃣ Instructor-এর সব Skills
  const skills = await prisma.instructorSkill.findMany({
    where: { userId },
    orderBy: { hourlyRateCents: "desc" },
  });

  // 2️⃣ User info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      about: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // 3️⃣ Reviews
  const reviews = await prisma.review.findMany({
    where: { receiverId: userId },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  // 4️⃣ Instructor total earnings (Order table থেকে)
  const earnings = await prisma.order.aggregate({
    where: {
      instructorId: userId,
      paymentStatus: "COMPLETED", // <-- Correct field
      teacherReceiveStatus: "PENDING", // optional: যদি টাকা এখনো না দেওয়া হয়
      teacherReceivedAmount: { not: null },
    },
    _sum: {
      teacherReceivedAmount: true,
    },
  });

  const totalEarnings = earnings._sum.teacherReceivedAmount || 0;

  // 5️⃣ Final response
  const response = {
    ...user,
    skillName: skills.map((s) => s.skillName),
    teachingLevel: skills.map((s) => s.teachingLevel),
    educationTraining: skills.map((s) => s.educationTraining),
    hourlyRateCents: skills.map((s) => s.hourlyRateCents),
    teachingMode: skills.map((s) => s.teachingMode),
    availableDays: skills.map((s) => s.availableDays),
    availabilitySchedule: skills.map((s) => s.availabilitySchedule),

    // review section
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      sender: r.sender,
    })),

    totalReviews,
    avgRating: Number(avgRating.toFixed(2)),

    // 🟢 NEW FIELD
    totalEarnings: Number(totalEarnings.toFixed(2)),
  };

  return response;
}; */

const getMyInstructorSkills = async (userId: string) => {
  // 1️⃣ Instructor-এর সব Skills
  const skills = await prisma.instructorSkill.findMany({
    where: { userId },
    orderBy: { hourlyRateCents: "desc" },
  });

  // 2️⃣ User info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      about: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // 3️⃣ Reviews
  const reviews = await prisma.review.findMany({
    where: { receiverId: userId },
    include: { sender: { select: { id: true, fullName: true, profileImage: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  // 4️⃣ Earnings
  const earnings = await prisma.order.aggregate({
    where: { instructorId: userId, paymentStatus: "COMPLETED", teacherReceivedAmount: { not: null } },
    _sum: { teacherReceivedAmount: true },
  });
  const totalEarnings = earnings._sum.teacherReceivedAmount || 0;

  // 5️⃣ Determine if first-time skill
  const isFirstTimeSkill = skills.length === 0;

  // 6️⃣ Response
  return {
    ...user,
    skillName: skills.map((s) => s.skillName),
    teachingLevel: skills.map((s) => s.teachingLevel),
    educationTraining: skills.map((s) => s.educationTraining),
    hourlyRateCents: skills.map((s) => s.hourlyRateCents),
    teachingMode: skills.map((s) => s.teachingMode),
    availableDays: skills.map((s) => s.availableDays),
    availabilitySchedule: skills.map((s) => s.availabilitySchedule),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      sender: r.sender,
    })),
    totalReviews,
    avgRating: Number(avgRating.toFixed(2)),
    totalEarnings: Number(totalEarnings.toFixed(2)),
    isFirstTimeSkill, // ✅ এখানে auto update
  };
};


const getInstructorSkillById = async (id: string) => {
  const profile = await prisma.instructorSkill.findUnique({
    where: { id },
  });

  if (!profile)
    throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

  return {
    ...profile,
    // availabilitySchedule is already JSON
    availabilitySchedule: profile.availabilitySchedule || {},
  };
};

// Update Instructor Skill
const updateInstructorSkill = async (id: string, payload: any) => {
  const profile = await prisma.instructorSkill.findUnique({ where: { id } });
  if (!profile)
    throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

  const updated = await prisma.instructorSkill.update({
    where: { id },
    data: {
      skillName: payload.skillName || profile.skillName,
      teachingLevel: payload.teachingLevel || profile.teachingLevel,
      educationTraining: payload.educationTraining ?? profile.educationTraining,
      hourlyRateCents: payload.hourlyRateCents ?? profile.hourlyRateCents,
      teachingMode: payload.teachingMode || profile.teachingMode,
      availableDays: payload.availableDays || profile.availableDays,
      availabilitySchedule:
        payload.availabilitySchedule || profile.availabilitySchedule,
    },
  });

  return {
    ...updated,
    availabilitySchedule: updated.availabilitySchedule || {},
  };
};

// Delete Instructor Skill
const deleteInstructorSkill = async (id: string) => {
  const profile = await prisma.instructorSkill.findUnique({ where: { id } });
  if (!profile)
    throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

  await prisma.instructorSkill.delete({ where: { id } });
  return profile;
};

export const instructorSkillService = {
  createInstructorSkill,
  getMyInstructorSkills,
  getInstructorSkillById,
  updateInstructorSkill,
  deleteInstructorSkill,
};
