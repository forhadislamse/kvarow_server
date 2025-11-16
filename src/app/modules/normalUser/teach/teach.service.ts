
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


/* const createInstructorSkill = async (userId: string, payload: any) => {
  // Check if user already has an InstructorSkill profile
  const exist = await prisma.instructorSkill.findFirst({
    where: { userId },
  });

  if (exist) {
    // User already has profile → cannot create again
    throw new ApiError(
      httpStatus.CONFLICT,
      "Instructor profile already exists. Please update it instead."
    );
  }

  // Create new InstructorSkill profile
  const profile = await prisma.instructorSkill.create({
    data: {
      userId,
      skillName: payload.skillName,
      teachingLevel: payload.teachingLevel,
      educationTraining: payload.educationTraining,
      hourlyRateCents: payload.hourlyRateCents,
      teachingMode: payload.teachingMode,
      availableDays: payload.availableDays || [],
      availabilitySchedule: payload.availabilitySchedule || undefined,
    },
  });

  return profile;
}; */


// const getMyInstructorSkills = async (userId: string) => {
//   const profiles = await prisma.instructorSkill.findMany({
//     where: { userId },
//     include: { user: true }, // Include user info
//     orderBy: { hourlyRateCents: "desc" },
//   });

//   return profiles.map((p) => ({
//     id: p.id,
//     userId: p.userId,
//     skillName: p.skillName,
//     teachingLevel: p.teachingLevel,
//     educationTraining: p.educationTraining,
//     hourlyRateCents: p.hourlyRateCents,
//     teachingMode: p.teachingMode,
//     availableDays: p.availableDays,
//     availabilitySchedule: p.availabilitySchedule, // Already JSON object
    
//     user: {
//       id: p.user.id,
//       fullName: p.user.fullName,
//       email: p.user.email,
//       profileImage: p.user.profileImage,
//       about: p.user.about,
//     },
//     createdAt: p.createdAt,
//     updatedAt: p.updatedAt,
//   }));
// };

// Get Instructor Skill by ID

const getMyInstructorSkills = async (userId: string) => {
  // ইউজারের সব InstructorSkill খুঁজে নাও
  const skills = await prisma.instructorSkill.findMany({
    where: { userId },
    orderBy: { hourlyRateCents: "desc" },
  });

  // ইউজার info একবার fetch কর
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

  // সব skill field আলাদা array হিসেবে map কর
  const response = {
    ...user,
    skillName: skills.map((s) => s.skillName),
    teachingLevel: skills.map((s) => s.teachingLevel),
    educationTraining: skills.map((s) => s.educationTraining),
    hourlyRateCents: skills.map((s) => s.hourlyRateCents),
    teachingMode: skills.map((s) => s.teachingMode),
    availableDays: skills.map((s) => s.availableDays),
    availabilitySchedule: skills.map((s) => s.availabilitySchedule),
  };

  return response;
};

const getInstructorSkillById = async (id: string) => {
  const profile = await prisma.instructorSkill.findUnique({
    where: { id },
  });

  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

  return {
    ...profile,
    // availabilitySchedule is already JSON
    availabilitySchedule: profile.availabilitySchedule || {},
  };
};

// Update Instructor Skill
const updateInstructorSkill = async (id: string, payload: any) => {
  const profile = await prisma.instructorSkill.findUnique({ where: { id } });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

  const updated = await prisma.instructorSkill.update({
    where: { id },
    data: {
      skillName: payload.skillName || profile.skillName,
      teachingLevel: payload.teachingLevel || profile.teachingLevel,
      educationTraining: payload.educationTraining ?? profile.educationTraining,
      hourlyRateCents: payload.hourlyRateCents ?? profile.hourlyRateCents,
      teachingMode: payload.teachingMode || profile.teachingMode,
      availableDays: payload.availableDays || profile.availableDays,
      availabilitySchedule: payload.availabilitySchedule || profile.availabilitySchedule,
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
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

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
