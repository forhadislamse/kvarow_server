
import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";

// ✅ Validation
const validateSubCategory = async (name: string, categoryId: string) => {
  if (!name || name.trim() === "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "SubCategory name is required");
  }
  if (!categoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "categoryId is required");
  }

  // Check duplicate name under same category
  const exist = await prisma.subCategory.findFirst({
    where: { name, categoryId },
  });
  if (exist) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "SubCategory already exists under this Category"
    );
  }
};

const createSubCategory = async (
  userRole: string,
  payload: { name: string; categoryId: string }
) => {
  // Only ADMIN can create
  if (userRole !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can create subcategory");
  }

  await validateSubCategory(payload.name, payload.categoryId);

  const categoryExist = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });
  if (!categoryExist)
    throw new ApiError(httpStatus.NOT_FOUND, "Parent Category not found");

  return await prisma.subCategory.create({ data: payload });
};



const getAllSubCategories = async (singleSearch?: string, search?: string) => {
  let whereClause = {};

  if (singleSearch) {
    // single search
    whereClause = {
      OR: [
        {
          name: { contains: singleSearch, mode: "insensitive" }, // subcategory name
        },
        {
          category: { name: { contains: singleSearch, mode: "insensitive" } }, // category name
        },
      ],
    };
  } else if (search) {
    // multiple search
    const searchTerms = search.split(",").map(term => term.trim());
    whereClause = {
      OR: searchTerms.map(term => ({
        OR: [
          { name: { contains: term, mode: "insensitive" } }, // subcategory
          { category: { name: { contains: term, mode: "insensitive" } } }, // category
        ],
      })),
    };
  }

  return await prisma.subCategory.findMany({
    where: whereClause,
    select: {
      name: true, // subcategory name
      skills: { select: { name: true } }, // related skills
    },
    orderBy: { name: "asc" },
  });
};



// ✅ Get By ID
const getSubCategoryById = async (id: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: { category: true, skills: true },
  });
  if (!subCategory) throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");
  return subCategory;
};

// ✅ Update
const updateSubCategory = async (
  id: string,
  payload: { name?: string; categoryId?: string },
  userRole: string
) => {
  // Only ADMIN can update
  if (userRole !== "ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only admin can update subcategory"
    );
  }

  const subCategory = await prisma.subCategory.findUnique({ where: { id } });
  if (!subCategory)
    throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");

  // Validate new name (if changed)
  if (payload.name && payload.name !== subCategory.name) {
    await validateSubCategory(payload.name, subCategory.categoryId);
  }

  return await prisma.subCategory.update({
    where: { id },
    data: payload,
  });
};

// ✅ Delete
const deleteSubCategory = async (id: string, userRole: string) => {
  // Only ADMIN can delete
  if (userRole !== "ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only admin can delete subcategory"
    );
  }

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: { skills: true },
  });
  if (!subCategory)
    throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");

  // Cascade delete skills under it
  await prisma.skill.deleteMany({ where: { subCategoryId: id } });

  return await prisma.subCategory.delete({ where: { id } });
};

// ✅ Export
export const subCategoryService = {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
};
