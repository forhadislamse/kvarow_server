
import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";

// ✅ Validation
const validateSkill = async (name: string, subCategoryId: string) => {
  if (!name || name.trim() === "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Skill name is required");
  }
  if (!subCategoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "subCategoryId is required");
  }

  // Check duplicate skill under same subCategory
  const exist = await prisma.skill.findFirst({
    where: { name, subCategoryId },
  });
  if (exist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Skill already exists under this SubCategory"
    );
  }
};

// ✅ Create Skill
const createSkill = async (payload: { name: string; subCategoryId: string }) => {
  await validateSkill(payload.name, payload.subCategoryId);

  const subCategoryExist = await prisma.subCategory.findUnique({
    where: { id: payload.subCategoryId },
  });
  if (!subCategoryExist)
    throw new ApiError(httpStatus.NOT_FOUND, "Parent SubCategory not found");

  return await prisma.skill.create({ data: payload });
};

// ✅ Get All Skills
const getAllSkills = async () => {
  return await prisma.skill.findMany({
    include: { subCategory: true },
    orderBy: { createdAt: "desc" },
  });
};

// ✅ Get Skill By ID
const getSkillById = async (id: string) => {
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: { subCategory: true },
  });
  if (!skill) throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");
  return skill;
};

// ✅ Update Skill
const updateSkill = async (
  id: string,
  payload: { name?: string; subCategoryId?: string },
  userId: string,
  userRole: string
) => {
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");

//   // Ownership / Admin Check
//   if (skill.createdBy && skill.createdBy !== userId && userRole !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You cannot update this Skill");
//   }

  // Validate name uniqueness (if changed)
  if (payload.name && payload.name !== skill.name) {
    await validateSkill(payload.name, skill.subCategoryId);
  }

  return await prisma.skill.update({
    where: { id },
    data: payload,
  });
};

// ✅ Delete Skill
const deleteSkill = async (id: string, userId: string, userRole: string) => {
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: { subCategory: true },
  });
  if (!skill) throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");

//   if (skill.createdBy && skill.createdBy !== userId && userRole !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You cannot delete this Skill");
//   }

  // Cascade delete SkillLevels (if model exists later)

  return await prisma.skill.delete({ where: { id } });
};

// ✅ Export All
export const skillService = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
};
