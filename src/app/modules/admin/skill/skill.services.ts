
import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";
// import { SkillLevelEnum } from "@prisma/client";

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

const createSkill = async (
  userRole: string,
  payload: { name: string; subCategoryId: string }
) => {
  // Only ADMIN can create
  if (userRole !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can create skill");
  }

  await validateSkill(payload.name, payload.subCategoryId);

  const subCategoryExist = await prisma.subCategory.findUnique({
    where: { id: payload.subCategoryId },
  });
  if (!subCategoryExist)
    throw new ApiError(httpStatus.NOT_FOUND, "Parent SubCategory not found");

  return await prisma.skill.create({ data: payload });
};



const getAllSkills = async (singleSearch?: string, search?: string) => {
  let whereClause = {};

  if (singleSearch) {
    // single skill search
    whereClause = {
      OR: [
        {
          name: { contains: singleSearch, mode: "insensitive" }, // skill name
        },
        {
          subCategory: { name: { contains: singleSearch, mode: "insensitive" } }, // subcategory name
        },
      ],
    };
  } else if (search) {
    // multiple skill search
    const searchTerms = search.split(",").map(term => term.trim());
    whereClause = {
      OR: searchTerms.map(term => ({
        OR: [
          { name: { contains: term, mode: "insensitive" } }, // skill name
          { subCategory: { name: { contains: term, mode: "insensitive" } } }, // subcategory name
        ],
      })),
    };
  }

  return await prisma.skill.findMany({
    where: whereClause,
    select: {
      name: true, // skill name
      subCategory: { select: { name: true } }, // related subcategory
    },
    orderBy: { name: "asc" },
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
  userRole: string
) => {
  if (userRole !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can update skill");
  }

  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");

  // Validate name uniqueness (if changed)
  if (payload.name && payload.name !== skill.name) {
    await validateSkill(payload.name, skill.subCategoryId);
  }

  return await prisma.skill.update({
    where: { id },
    data: payload,
  });
};

const deleteSkill = async (id: string, userRole: string) => {
  if (userRole !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can delete skill");
  }

  const skill = await prisma.skill.findUnique({
    where: { id },
    include: { subCategory: true },
  });
  if (!skill) throw new ApiError(httpStatus.NOT_FOUND, "Skill not found");

  // Cascade delete SkillLevels if needed

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
