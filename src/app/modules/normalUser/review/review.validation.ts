import { z } from 'zod';

const createSchema = z.object({
  receiverId: z.string().min(1, 'ReceiverId is required!'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot be more than 5'),
  comment: z.string().min(1, 'Comment is required!'), 
});

const updateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  isApproved: z.boolean().optional(),
});

export const reviewValidation = {
  createSchema,
  updateSchema,
};
