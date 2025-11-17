import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../../../helpars/paginationHelper";


export interface IGetAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  removed?: "true" | "false"; // Active / Removed users
}

// const allUsers = async (options: IGetAllOptions = {}, userId: string) => {
//   const { skip, limit, sortBy, sortOrder, page } =
//     paginationHelper.calculatePagination(options);

//   const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
//   if (!requestingUser) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Requesting user not found!");
//   }

//   const isRemoved = options.removed === "true";

//   const searchFilter: Prisma.UserWhereInput = {
//     role: "USER",
//     isDeleted: isRemoved,
//     ...(options.search
//       ? {
//           OR: [
//             { fullName: { contains: options.search, mode: "insensitive" } },
//             { email: { contains: options.search, mode: "insensitive" } },
//           ],
//         }
//       : {}),
//   };

//   const users = await prisma.user.findMany({
//     where: searchFilter,
//     skip,
//     take: limit,
//     orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
//     select: {
//       id: true,
//       fullName: true,
//       email: true,
//       profileImage: true,
//       status: true,
//       createdAt: true,
//     },
//   });

//   if (!users.length) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Users not found!");
//   }

//   const [totalUsersCount, totalActiveUsers, totalRemovedUsers] = await Promise.all([
//     prisma.user.count({ where: searchFilter }),
//     prisma.user.count({ where: { role: "USER", isDeleted: false } }),
//     prisma.user.count({ where: { role: "USER", isDeleted: true } }),
//   ]);

//   const usersWithSerial = users.map((user, index) => ({
//     serial: skip + index + 1,
//     ...user,
//   }));

//   return {
//     meta: {
//       page,
//       limit,
//       totalUsers: totalUsersCount,
//       totalPages: Math.ceil(totalUsersCount / limit),
//       totalActiveUsers,
//       totalRemovedUsers,
//     },
//     data: usersWithSerial,
//   };
// };

const allUsers = async (options: IGetAllOptions = {}, userId: string) => {
  const { skip, limit, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

  // Fetch requesting user
  const requestingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!requestingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Requesting user not found!");
  }

  const isRemoved = options.removed === "true";

  const searchFilter: Prisma.UserWhereInput = {
    role: "USER",
    isDeleted: isRemoved,
    ...(options.search
      ? {
          OR: [
            { fullName: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Fetch users
  const users = await prisma.user.findMany({
    where: searchFilter,
    skip,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      status: true,
      createdAt: true,
    },
  });

  // Total counts (parallel)
  const [totalUsersCount, totalActiveUsers, totalRemovedUsers] = await Promise.all([
    prisma.user.count({ where: searchFilter }),
    prisma.user.count({ where: { role: "USER", isDeleted: false } }),
    prisma.user.count({ where: { role: "USER", isDeleted: true } }),
  ]);

  // Add serial numbers
  const usersWithSerial = users.map((user, index) => ({
    serial: skip + index + 1,
    ...user,
  }));

  // Always return data (empty array possible)
  return {
    meta: {
      page,
      limit,
      totalUsers: totalUsersCount,
      totalPages: Math.ceil(totalUsersCount / limit),
      totalActiveUsers,
      totalRemovedUsers,
    },
    data: usersWithSerial,
  };
};

const softDeleteUser = async (userIdToDelete: string, adminId: string) => {
  // 1️⃣ Verify admin exists
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin user not found");
  }

  // 2️⃣ Verify target user exists
  const user = await prisma.user.findUnique({ where: { id: userIdToDelete } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // 3️⃣ Check if already deleted
  if (user.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User is already deleted");
  }

  // 4️⃣ Soft delete user
  const updatedUser = await prisma.user.update({
    where: { id: userIdToDelete },
    data: { isDeleted: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      isDeleted: true,
      status: true,
      role: true,
      createdAt: true,
    },
  });

  return updatedUser;
};

export const adminUserService = {
  allUsers,
  softDeleteUser,
};
