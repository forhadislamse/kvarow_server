
import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";



const createInstructorSkill = async (userId: string, payload: any) => {
  if (!payload.skill) throw new ApiError(httpStatus.BAD_REQUEST, "Skill is required");

  // find skill by name
  const skill = await prisma.skill.findFirst({ where: { name: payload.skill } });
  if (!skill) throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");


  // check duplicate
  const exist = await prisma.instructorSkill.findUnique({
    where: { userId_skillId: { userId, skillId: skill.id } },
  });
  if (exist) throw new ApiError(httpStatus.CONFLICT, "Teaching profile already exists for this skill");

  const profile = await prisma.instructorSkill.create({
    data: {
      userId,
      skillId: skill.id,
      teachingLevel: payload.teachingLevel,
      educationTraining: payload.educationTraining,
      hourlyRateCents: payload.hourlyRateCents,
      teachingMode: payload.teachingMode,
      availabilityScheduleJson: payload.availabilityScheduleJson ? JSON.stringify(payload.availabilityScheduleJson) : undefined,
    },
  });

  return { ...profile, skill: skill.name };
};

const getMyInstructorSkills = async (userId: string) => {
  const profiles = await prisma.instructorSkill.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: { hourlyRateCents: "desc"  },
  }) as any[];

  return profiles.map((p) => ({
    ...p,
    skill: p.skill?.name,
    availabilityScheduleJson: p.availabilityScheduleJson ? JSON.parse(p.availabilityScheduleJson) : {},
  }));
};

const getInstructorSkillById = async (id: string) => {
  const profile = await prisma.instructorSkill.findUnique({
    where: { id },
    include: { skill: true },
  });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

  return { ...profile, skill: profile.skill.name, availabilityScheduleJson: profile.availabilityScheduleJson ? JSON.parse(profile.availabilityScheduleJson) : {} };
};

const updateInstructorSkill = async (id: string, payload: any) => {
  const profile = await prisma.instructorSkill.findUnique({ where: { id } });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, "Instructor profile not found");

  // If skill name updated, find skillId
  let skillId = profile.skillId;
  if (payload.skill) {
    const skill = await prisma.skill.findFirst({ where: { name: payload.skill } });
    if (!skill) throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");
    skillId = skill.id;
  }

  const updated = await prisma.instructorSkill.update({
    where: { id },
    data: {
      skillId,
      teachingLevel: payload.teachingLevel,
      educationTraining: payload.educationTraining,
      hourlyRateCents: payload.hourlyRateCents,
      teachingMode: payload.teachingMode,
      availabilityScheduleJson: payload.availabilityScheduleJson ? JSON.stringify(payload.availabilityScheduleJson) : undefined,
    },
  });

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  return { ...updated, skill: skill?.name, availabilityScheduleJson: updated.availabilityScheduleJson ? JSON.parse(updated.availabilityScheduleJson) : {} };
};

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
