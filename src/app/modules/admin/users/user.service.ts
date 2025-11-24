import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";
import { OrderStatus, PaymentStatus, Prisma, UserRole, UserStatus } from "@prisma/client";
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




/* const allUsers = async (options: IGetAllOptions = {}, userId: string) => {
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
  const [totalActiveUsers, totalRemovedUsers] = await Promise.all([
    prisma.user.count({ where: { role: "USER", isDeleted: false } }),
    prisma.user.count({ where: { role: "USER", isDeleted: true } }),
  ]);

  const totalUsersCount = totalActiveUsers + totalRemovedUsers; // updated here

  // Add serial numbers
  const usersWithSerial = users.map((user, index) => ({
    serial: skip + index + 1,
    ...user,
  }));

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
 */

/* const allUsers = async (options: IGetAllOptions = {}, userId: string) => {
  const { skip, limit, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

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

  const [totalActiveUsers, totalRemovedUsers] = await Promise.all([
    prisma.user.count({ where: { role: "USER", isDeleted: false } }),
    prisma.user.count({ where: { role: "USER", isDeleted: true } }),
  ]);

  const totalUsersCount = totalActiveUsers + totalRemovedUsers; // Fixed & never changes

  // totalPages should be based on current filter
  let totalForPagination = totalUsersCount; // default (all)

  if (options.removed === "true") {
    totalForPagination = totalRemovedUsers;
  } else if (options.removed === "false") {
    totalForPagination = totalActiveUsers;
  }

  const usersWithSerial = users.map((user, index) => ({
    serial: skip + index + 1,
    ...user,
  }));

  return {
    meta: {
      page,
      limit,
      totalUsers: totalUsersCount,        // ❗Always active + removed
      totalActiveUsers,                   // ✔ Pure active
      totalRemovedUsers,                  // ✔ Pure removed
      totalPages: Math.ceil(totalForPagination / limit), // ✔ Dynamic based on filter
    },
    data: usersWithSerial,
  };
}; */

const allUsers = async (options: IGetAllOptions = {}, userId: string) => {
  const { skip, limit, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

  const requestingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!requestingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Requesting user not found!");
  }

  // Filter logic (dynamic)
  const searchFilter: Prisma.UserWhereInput = {
    role: "USER",

    ...(options.removed === "true"
      ? { isDeleted: true }
      : options.removed === "false"
      ? { isDeleted: false }
      : {}),

    ...(options.search
      ? {
          OR: [
            { fullName: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

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

  // Total (global)
  const [totalActiveUsers, totalRemovedUsers] = await Promise.all([
    prisma.user.count({ where: { role: "USER", isDeleted: false } }),
    prisma.user.count({ where: { role: "USER", isDeleted: true } }),
  ]);

  const totalUsersCount = totalActiveUsers + totalRemovedUsers;

  // For pagination → count only filtered users
  const filteredUsersCount = await prisma.user.count({ where: searchFilter });

  const usersWithSerial = users.map((u, index) => ({
    serial: skip + index + 1,
    ...u,
  }));

  return {
    meta: {
      page,
      limit,
      totalUsers: totalUsersCount,
      totalActiveUsers,
      totalRemovedUsers,
      totalPages: Math.ceil(filteredUsersCount / limit),
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


/* const getCategoryOverview = async (adminId: string) => {
  // 1. Check admin role
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only ADMIN can access this data");
  }

  // 2. Fetch categories with subcategories and skills
  const categories = await prisma.category.findMany({
    include: { subCategories: { include: { skills: true } } },
  });

  // 3. Fetch all instructorSkills + orders + payments
  const instructorSkills = await prisma.instructorSkill.findMany({
    include: { orders: { include: { payments: true } } },
  });

  // 4. Build hierarchical paid order counts
  const result = categories.map(category => {
    let categoryPaidOrders = 0;

    const subCategories = category.subCategories.map(sc => {
      let subCategoryPaidOrders = 0;

      const skills = sc.skills.map(skill => {
        const relatedInstructorSkills = instructorSkills.filter(
          ins => ins.skillName?.trim().toLowerCase() === skill.name.trim().toLowerCase()
        );

        let skillPaidOrders = 0;
        relatedInstructorSkills.forEach(insSkill => {
          insSkill.orders.forEach(order => {
            order.payments.forEach(payment => {
              if (payment.status === "COMPLETED") {
                skillPaidOrders += 1;
                subCategoryPaidOrders += 1;
                categoryPaidOrders += 1;
              }
            });
          });
        });

        return {
          skillName: skill.name,
          paidOrders: skillPaidOrders,
        };
      });

      return {
        subCategoryName: sc.name,
        skillCount: sc.skills.length,
        paidOrders: subCategoryPaidOrders,
        skills,
      };
    });

    return {
      categoryName: category.name,
      subCategoryCount: category.subCategories.length,
      skillCount: category.subCategories.reduce((acc, sc) => acc + sc.skills.length, 0),
      paidOrders: categoryPaidOrders,
      subCategories,
    };
  });

  return result;
}; */


export interface IOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResult<T> {
  meta: Meta;
  data: T[];
}

const getCategoryOverview = async (
  adminId: string,
  options: IOptions = {}
): Promise<{
  topStats: {
    topSkills: number;
    totalCategories: number;
    totalSubCategories: number;
    totalSkills: number;
  };
  tables: {
    categories: PaginatedResult<{ name: string; subCategories: number; skills: number; orders: number }>;
  };
}> => {
  const { page, limit } = paginationHelper.calculatePagination(options);

  // 1️⃣ Check admin
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only ADMIN can access this data");
  }

  // 2️⃣ Fetch categories + subcategories + skills
  const categories = await prisma.category.findMany({
    include: { subCategories: { include: { skills: true } } },
  });

  const instructorSkills = await prisma.instructorSkill.findMany({
    include: { orders: { include: { payments: true } } },
  });

  let totalSkillsCount = 0;
  const allSkillsData: { name: string; orders: number }[] = [];

  const categoriesData = categories.map(category => {
    let categoryPaidOrders = 0;

    category.subCategories.forEach(sc => {
      let subCategoryPaidOrders = 0;

      sc.skills.forEach(skill => {
        totalSkillsCount += 1;

        const relatedInstructorSkills = instructorSkills.filter(
          ins => ins.skillName?.trim().toLowerCase() === skill.name.trim().toLowerCase()
        );

        let skillPaidOrders = 0;
        relatedInstructorSkills.forEach(insSkill => {
          insSkill.orders.forEach(order => {
            order.payments.forEach(payment => {
              if (payment.status === "COMPLETED") {
                skillPaidOrders += 1;
                subCategoryPaidOrders += 1;
                categoryPaidOrders += 1;
              }
            });
          });
        });

        allSkillsData.push({ name: skill.name, orders: skillPaidOrders });
      });
    });

    return {
      name: category.name,
      subCategories: category.subCategories.length,
      skills: category.subCategories.reduce((acc, sc) => acc + sc.skills.length, 0),
      orders: categoryPaidOrders,
    };
  });

  // ------------------- TopSkills count update -------------------
  const topSkillsCount = allSkillsData.filter(skill => skill.orders >= 1).length;

  // ------------------- Helper to paginate categories -------------------
  const paginateWithMeta = <T>(data: T[], page: number, limit: number): PaginatedResult<T> => {
    const total = data.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data: data.slice(start, end),
    };
  };

  return {
    topStats: {
      topSkills: topSkillsCount,
      totalCategories: categories.length,
      totalSubCategories: categoriesData.reduce((acc, cat) => acc + cat.subCategories, 0),
      totalSkills: totalSkillsCount,
    },
    tables: {
      categories: paginateWithMeta(categoriesData, page, limit),
    },
  };
};



const getSubCategoriesTable = async (
  adminId: string,
  options: IOptions = {}
): Promise<PaginatedResult<{ name: string; skills: number; orders: number }>> => {
  const { page, limit } = paginationHelper.calculatePagination(options);

  // check admin
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only ADMIN can access this data");
  }

  // fetch categories + subcategories + skills
  const categories = await prisma.category.findMany({
    include: { subCategories: { include: { skills: true } } },
  });

  const instructorSkills = await prisma.instructorSkill.findMany({
    include: { orders: { include: { payments: true } } },
  });

  // map subcategories
  const allSubCategories = categories.flatMap(cat =>
    cat.subCategories.map(sc => {
      let subCategoryPaidOrders = 0;

      sc.skills.forEach(skill => {
        const relatedInstructorSkills = instructorSkills.filter(
          ins => ins.skillName?.trim().toLowerCase() === skill.name.trim().toLowerCase()
        );

        relatedInstructorSkills.forEach(insSkill => {
          insSkill.orders.forEach(order => {
            order.payments.forEach(payment => {
              if (payment.status === "COMPLETED") {
                subCategoryPaidOrders += 1;
              }
            });
          });
        });
      });

      return {
        name: sc.name,
        skills: sc.skills.length,
        orders: subCategoryPaidOrders,
      };
    })
  );

  const total = allSubCategories.length;
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: allSubCategories.slice((page - 1) * limit, (page - 1) * limit + limit),
  };
};

// ------------------ Skills Table ------------------
const getSkillsTable = async (
  adminId: string,
  options: IOptions = {}
): Promise<PaginatedResult<{ name: string; orders: number }>> => {
  const { page, limit } = paginationHelper.calculatePagination(options);

  // check admin
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only ADMIN can access this data");
  }

  const categories = await prisma.category.findMany({
    include: { subCategories: { include: { skills: true } } },
  });

  const instructorSkills = await prisma.instructorSkill.findMany({
    include: { orders: { include: { payments: true } } },
  });

  const allSkills: { name: string; orders: number }[] = [];

  categories.forEach(cat => {
    cat.subCategories.forEach(sc => {
      sc.skills.forEach(skill => {
        let skillPaidOrders = 0;
        const relatedInstructorSkills = instructorSkills.filter(
          ins => ins.skillName?.trim().toLowerCase() === skill.name.trim().toLowerCase()
        );

        relatedInstructorSkills.forEach(insSkill => {
          insSkill.orders.forEach(order => {
            order.payments.forEach(payment => {
              if (payment.status === "COMPLETED") {
                skillPaidOrders += 1;
              }
            });
          });
        });

        allSkills.push({ name: skill.name, orders: skillPaidOrders });
      });
    });
  });

  const total = allSkills.length;
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: allSkills.slice((page - 1) * limit, (page - 1) * limit + limit),
  };
};

const getCurrentMonthOrderStats = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "COMPLETED",
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      userPayAmount: true,
      createdAt: true,
    },
  });

  const dailyMap = new Map<number, number>();

  orders.forEach((o) => {
    const day = new Date(o.createdAt).getDate();
    const amount = o.userPayAmount || 0;
    dailyMap.set(day, (dailyMap.get(day) || 0) + amount);
  });

  const daysInMonth = endOfMonth.getDate();

  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    amount: dailyMap.get(i + 1) || 0,
  }));
};


/* const dashboardStats = async (options: any = {}, adminId: string) => {
  // admin check
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");

  // Parallel queries
  const [
    totalUsers,
    totalActiveUsers,
    completedOrders,
    totalRevenueAgg,
    dailyOrderData,
  ] = await Promise.all([
    // total users
    prisma.user.count(),

    // total active users
    prisma.user.count({ where: { status: "ACTIVE" } }),

    // all completed orders (for counting top skills)
    prisma.order.findMany({
      where: { paymentStatus: "COMPLETED" },
      include: { skill: true },
    }),

    // total admin earnings
    prisma.order.aggregate({
      where: { paymentStatus: "COMPLETED" },
      _sum: { adminEarnings: true },
    }),

    // daily monthly chart data
    getCurrentMonthOrderStats(),
  ]);

  // Top skills (>= 3 completed orders)
  const skillCountMap: Record<string, number> = {};
  completedOrders.forEach((ord) => {
    const skill = ord.skill?.skillName;
    if (!skill) return;
    skillCountMap[skill] = (skillCountMap[skill] || 0) + 1;
  });

  const totalTopSkills = Object.values(skillCountMap).filter(
    (c) => c >= 3
  ).length;

  return {
    stats: {
      totalUsers,
      totalActiveUsers,
      totalTopSkills,
      totalRevenue: totalRevenueAgg._sum.adminEarnings || 0,
    },
    data: {
      month: new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      dailyOrders: dailyOrderData,
    },
  };
}; */

const dashboardStats = async (options: any = {}, adminId: string) => {
  // admin check
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");

  // Parallel queries
  const [
    totalUsers,
    totalActiveUsers,
    totalRemovedUsers,
    completedOrders,
    totalRevenueAgg,
    dailyOrderData,
  ] = await Promise.all([
    // total users (only USER role)
    prisma.user.count({ where: { role: "USER" } }),

    // total active users (USER + not deleted)
    prisma.user.count({
      where: { role: "USER", isDeleted: false },
    }),

    // total removed users
    prisma.user.count({
      where: { role: "USER", isDeleted: true },
    }),

    // all completed orders (for counting top skills)
    prisma.order.findMany({
      where: { paymentStatus: "COMPLETED" },
      include: { skill: true },
    }),

    // total admin earnings
    prisma.order.aggregate({
      where: { paymentStatus: "COMPLETED" },
      _sum: { adminEarnings: true },
    }),

    // daily monthly chart data
    getCurrentMonthOrderStats(),
  ]);

  // Top skills (>= 3 completed orders)
  const skillCountMap: Record<string, number> = {};
  completedOrders.forEach((ord) => {
    const skill = ord.skill?.skillName;
    if (!skill) return;
    skillCountMap[skill] = (skillCountMap[skill] || 0) + 1;
  });

  const totalTopSkills = Object.values(skillCountMap).filter((c) => c >= 1).length;

  return {
    stats: {
      totalUsers,
      totalActiveUsers,
      totalRemovedUsers,
      totalTopSkills,
      totalRevenue: totalRevenueAgg._sum.adminEarnings || 0,
    },
    data: {
      month: new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      dailyOrders: dailyOrderData,
    },
  };
};


const getCancelledOrders = async (
  userId: string,
  role: string,
  options: IOptions = {}
) => {
  if (role !== "ADMIN") {
    throw new ApiError(403, "Only Admin can access cancelled orders");
  }

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.COMPLETED,

    },
    include: {
      student: { select: { fullName: true } },
      instructor: { select: { fullName: true } },
      skill: { select: { skillName: true } },
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const totalOrders = await prisma.order.count({
    where: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.COMPLETED },
  });

  const formattedOrders = orders.map((order, index) => ({
    serial: skip + index + 1,
    orderId: order.id,
    studentName: order.student.fullName,
    teacherName: order.instructor.fullName,
    skillName: order.skill?.skillName || null,
    createdAt: order.createdAt,
  }));

  return {
    meta: {
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
    },
    data: formattedOrders,
  };
};

const getConfirmedOrders = async (
  userId: string,
  role: string,
  options: IOptions = {}
) => {
  if (role !== "ADMIN") {
    throw new ApiError(403, "Only Admin can access confirmed orders");
  }

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
      teacherReceiveStatus: PaymentStatus.PENDING,
    },
    include: {
      student: { select: { fullName: true } },
      instructor: { select: { fullName: true } },
      skill: { select: { skillName: true } },
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const totalOrders = await prisma.order.count({
    where: { status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.COMPLETED, teacherReceiveStatus: PaymentStatus.PENDING },
  });

  const formattedOrders = orders.map((order, index) => ({
    serial: skip + index + 1,
    orderId: order.id,
    studentName: order.student.fullName,
    teacherName: order.instructor.fullName,
    skillName: order.skill?.skillName || null,
    createdAt: order.createdAt,
  }));

  return {
    meta: {
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
    },
    data: formattedOrders,
  };
};

/* const getFinancialSummary = async (adminId: string) => {
  // admin check
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
    throw new Error("Only ADMIN can access this data");
  }

  const [totalTransactionAgg, totalRefundAgg, totalPendingFundAgg] =
    await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.COMPLETED },
        _sum: { userPayAmount: true },
      }),
      prisma.order.aggregate({
        where: { status: OrderStatus.CANCELLED, teacherReceiveStatus: PaymentStatus.REFUNDED
         },
        _sum: { userPayAmount: true },
      }),
      prisma.order.aggregate({
        where: { status: OrderStatus.CANCELLED, teacherReceiveStatus: PaymentStatus.PENDING },
        _sum: { userPayAmount: true },
      }),
    ]);

  return {
    totalTransaction: totalTransactionAgg._sum.userPayAmount || 0,
    totalRefund: totalRefundAgg._sum.userPayAmount || 0,
    totalPendingFund: totalPendingFundAgg._sum.userPayAmount || 0,
  };
}; */



const getFinancialSummary = async (adminId: string) => {
  // 1️⃣ Check if user is ADMIN or SUPER_ADMIN
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
    throw new Error("Only ADMIN can access this data");
  }

  // 2️⃣ Aggregate totals
  const [totalTransactionAgg, totalRefundAgg, totalPendingFundAgg] =
    await Promise.all([
      // Total completed payments (includes all completed)
      prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.COMPLETED },
        _sum: { userPayAmount: true },
      }),

      // Total refunded payments
      prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.REFUNDED },
        _sum: { userPayAmount: true },
      }),

      // Total pending funds for instructors (cancelled orders but not yet received by teacher)
      prisma.order.aggregate({
        where: { status: OrderStatus.CANCELLED, teacherReceiveStatus: PaymentStatus.PENDING },
        _sum: { teacherReceivedAmount: true },
      }),
    ]);

  // 3️⃣ Return formatted result
  return {
    totalTransaction: totalTransactionAgg._sum.userPayAmount || 0,
    totalRefund: totalRefundAgg._sum.userPayAmount || 0,
    totalPendingFund: totalPendingFundAgg._sum.teacherReceivedAmount || 0,
  };
};



export const adminUserService = {
  allUsers,
  softDeleteUser,
  getCategoryOverview,
  getSubCategoriesTable,
  getSkillsTable,
  dashboardStats,
  getCancelledOrders,
  getConfirmedOrders,
  getFinancialSummary,
};
