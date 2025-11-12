import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";

// Simple validation function
const validateCategoryName = (name: string) => {
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
};

const getAllCategories = async () => {
  return await prisma.category.findMany({
    include: { subCategories: true },
    orderBy: { createdAt: "desc" },
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
  userId: string,
  userRole: string
) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, "Category not found");


  if (payload.name && payload.name !== category.name) {
    validateCategoryName(payload.name);

    const exist = await prisma.category.findUnique({ where: { name: payload.name } });
    if (exist) throw new ApiError(httpStatus.CONFLICT, "Category name already exists");
  }

  return await prisma.category.update({ where: { id }, data: payload });
};

const deleteCategory = async (id: string, userId: string, userRole: string) => {
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