import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";

// Simple validation function
/* const validateCategoryName = (name: string) => {
  if (!name || name.trim() === "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category name is required");
  }
};

const createCategory = async (payload: { name: string }) => {
  validateCategoryName(payload.name);

  // Check unique
  const exist = await prisma.category.findUnique({ where: { name: payload.name } });
  if (exist) throw new ApiError(httpStatus.CONFLICT, "Category already exists");

  return await prisma.category.create({ data: { name: payload.name } });
}; */


const validateCategoryName = (name: string) => {
  if (!name || name.trim() === "") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category name is required");
  }
};

const createCategory = async (role: string, payload: { name: string }) => {
  // Only ADMIN
  if (role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can create category");
  }

  validateCategoryName(payload.name);

  const exist = await prisma.category.findUnique({ where: { name: payload.name } });
  if (exist) {
    throw new ApiError(httpStatus.CONFLICT, "Category already exists");
  }

  return prisma.category.create({ data: { name: payload.name } });
};



/* const getAllCategories = async (search?: string) => {
  // search string ke split kore array banano
  const searchTerms = search?.split(",").map(term => term.trim());

  return await prisma.category.findMany({
    where: searchTerms && searchTerms.length > 0
      ? {
          OR: searchTerms.map(term => ({
            name: {
              contains: term,
              mode: "insensitive",
            },
          })),
        }
      : {},

    select: {
      name: true,
      subCategories: {
        select: { name: true }, // oi category er sob subcategory fetch hobe
      },
    },

    orderBy: { name: "asc" },
  });
}; */

const getAllCategories = async (singleSearch?: string, search?: string) => {
  let whereClause = {};

  if (singleSearch) {
    // single search
    whereClause = {
      name: {
        contains: singleSearch,
        mode: "insensitive",
      },
    };
  } else if (search) {
    // multiple search
    const searchTerms = search.split(",").map(term => term.trim());
    whereClause = {
      OR: searchTerms.map(term => ({
        name: { contains: term, mode: "insensitive" },
      })),
    };
  }

  return await prisma.category.findMany({
    where: whereClause,
    select: {
      name: true,
      subCategories: {
        select: { name: true },
      },
    },
    orderBy: { name: "asc" },
  });
};


const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { subCategories: true },
  });
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  return category;
};

const updateCategory = async (
  id: string,
  payload: { name?: string },
  user: { id: string; role: string }
) => {
  if (user.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can update category");
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");

  if (payload.name && payload.name !== category.name) {
    validateCategoryName(payload.name);

    const exist = await prisma.category.findUnique({ where: { name: payload.name } });
    if (exist) throw new ApiError(httpStatus.CONFLICT, "Category name already exists");
  }

  return await prisma.category.update({ where: { id }, data: payload });
};

const deleteCategory = async (id: string, user: { id: string; role: string }) => {
  if (user.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only admin can delete category");
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");

  return await prisma.category.delete({ where: { id } });
};
// Export all together
export const categoryServices = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};