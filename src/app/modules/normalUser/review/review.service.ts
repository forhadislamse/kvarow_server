import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiError";
import { paginationHelper } from "../../../../helpars/paginationHelper";


interface IGetAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  receiverId?: string;
}

// Create Review
const create = async ({
  userId,
  review,
}: {
  userId: string;
  review: {
    receiverId: string;
    rating: number;
    comment?: string;
  };
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  const receiver = await prisma.user.findUnique({
    where: { id: review.receiverId },
  });
  if (!receiver)
    throw new ApiError(httpStatus.NOT_FOUND, "Receiver user not found!");

  const result = await prisma.review.create({
    data: {
      senderId: userId,
      receiverId: review.receiverId,
      rating: review.rating,
      comment: review.comment || "",
    },
  });

  return result;
};




// Get all reviews
// const getAllReviews = async (options: IGetAllOptions = {}) => {
//   const { skip, limit, sortBy, sortOrder, page } =
//     paginationHelper.calculatePagination(options);

//   // const filter: Prisma.ReviewWhereInput = {
//   //   ...(options.receiverId && { receiverId: options.receiverId }) || {},
//   // };

//   const reviews = await prisma.review.findMany({
//     // where: filter,
//     skip,
//     take: limit,
//     orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" },
//     include: {
//       sender: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//         },
//       },
//       receiver: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//         },
//       },
//     },
//   });

//   const total = await prisma.review.count();

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//     data: reviews,
//   };
// };

// // Get single review
// const getSingleReview = async (reviewId: string) => {
//   const review = await prisma.review.findUnique({
//     where: { id: reviewId },
//     include: {
//       sender: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//         },
//       },
//       receiver: {
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           profileImage: true,
//         },
//       },
//     },
//   });

//   if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found!");
//   return review;
// };

// // Approve / Unapprove review
// // const approveReview = async (id: string) => {
// //   const review = await prisma.review.findUnique({ where: { id } });
// //   if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found!");

// //   const result = await prisma.review.update({
// //     where: { id },
// //     data: { isApproved: !review.isApproved },
// //   });

// //   return result;
// // };

// // Delete review
// const remove = async (id: string) => {
//   const review = await prisma.review.findUnique({ where: { id } });
//   if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found!");

//   return await prisma.review.delete({ where: { id } });
// };

const getReviewsForInstructor = async (instructorId: string) => {
  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
  });

  if (!instructor)
    throw new ApiError(httpStatus.NOT_FOUND, "Instructor not found!");

  const reviews = await prisma.review.findMany({
    where: { receiverId: instructorId },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;

  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  return {
    totalReviews,
    avgRating: Number(avgRating.toFixed(2)),
    reviews,
  };
};


export const reviewService = {
  create,
  getReviewsForInstructor,
  // getAllReviews,
  // getSingleReview,
  // approveReview,
  // remove,
};
