
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

// ✅ Create
const createSubCategory = async (payload: { name: string; categoryId: string }) => {
  await validateSubCategory(payload.name, payload.categoryId);

  const categoryExist = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });
  if (!categoryExist)
    throw new ApiError(httpStatus.NOT_FOUND, "Parent Category not found");

  return await prisma.subCategory.create({ data: payload });
};

// ✅ Get All
const getAllSubCategories = async () => {
  return await prisma.subCategory.findMany({
    include: { category: true, skills: true },
    orderBy: { createdAt: "desc" },
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
  userId: string,
  userRole: string
) => {
  const subCategory = await prisma.subCategory.findUnique({ where: { id } });
  if (!subCategory) throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");

//   // Ownership / Admin Check
//   if (subCategory.createdBy && subCategory.createdBy !== userId && userRole !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You cannot update this SubCategory");
//   }

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
const deleteSubCategory = async (id: string, userId: string, userRole: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: { skills: true },
  });
  if (!subCategory) throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");

//   if (subCategory.createdBy && subCategory.createdBy !== userId && userRole !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You cannot delete this SubCategory");
//   }

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
