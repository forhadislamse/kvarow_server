// import { PrismaClient } from "@prisma/client";
// import httpStatus from "http-status";
// import ApiError from "../../../../errors/ApiError";


// const prisma = new PrismaClient();

// /** Create User Interest */
// const createInterest = async (userId: string, payload: any) => {
//   const { categoryId, selectedSubCategoryId, selectedSkillId, skillLevel } = payload;

//   if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, "Category ID is required");

//   // Prevent duplicate interest
//   const exist = await prisma.userCategoryInterest.findFirst({
//     where: { userId, categoryId },
//   });
//   if (exist) throw new ApiError(httpStatus.CONFLICT, "Interest already added for this category");

//   return await prisma.userCategoryInterest.create({
//     data: {
//       userId,
//       categoryId,
//       selectedSubCategoryId,
//       selectedSkillId,
//       skillLevel: skillLevel || "BEGINNER",
//     },
//   });
// };

// /** Get All Interests (User/Admin) */
// const getAllInterests = async (userId: string, role: string) => {
//   if (role === "ADMIN") {
//     return await prisma.userCategoryInterest.findMany({
//       include: { category: true, user: true },
//       orderBy: { createdAt: "desc" },
//     });
//   }

//   // For normal users – only their interests
//   return await prisma.userCategoryInterest.findMany({
//     where: { userId },
//     include: { category: true },
//     orderBy: { createdAt: "desc" },
//   });
// };

// /** Get Single Interest */
// const getInterestById = async (id: string, userId: string, role: string) => {
//   const interest = await prisma.userCategoryInterest.findUnique({
//     where: { id },
//     include: { category: true },
//   });
//   if (!interest) throw new ApiError(httpStatus.NOT_FOUND, "Interest not found");

//   if (interest.userId !== userId && role !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You cannot view this interest");
//   }

//   return interest;
// };

// /** Update Interest (skillLevel or skill change) */
// const updateInterest = async (id: string, userId: string, role: string, payload: any) => {
//   const interest = await prisma.userCategoryInterest.findUnique({ where: { id } });
//   if (!interest) throw new ApiError(httpStatus.NOT_FOUND, "Interest not found");

//   if (interest.userId !== userId && role !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You cannot update this interest");
//   }

//   return await prisma.userCategoryInterest.update({
//     where: { id },
//     data: {
//       selectedSubCategoryId: payload.selectedSubCategoryId ?? interest.selectedSubCategoryId,
//       selectedSkillId: payload.selectedSkillId ?? interest.selectedSkillId,
//       skillLevel: payload.skillLevel ?? interest.skillLevel,
//     },
//   });
// };

// /** Delete Interest */
// const deleteInterest = async (id: string, userId: string, role: string) => {
//   const interest = await prisma.userCategoryInterest.findUnique({ where: { id } });
//   if (!interest) throw new ApiError(httpStatus.NOT_FOUND, "Interest not found");

//   if (interest.userId !== userId && role !== "ADMIN") {
//     throw new ApiError(httpStatus.FORBIDDEN, "You cannot delete this interest");
//   }

//   return await prisma.UserCategoryInterest.delete({ where: { id } });
// };

// export const userCategoryInterestService = {
//   createInterest,
//   getAllInterests,
//   getInterestById,
//   updateInterest,
//   deleteInterest,
// };
