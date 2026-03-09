import { z } from "zod";

export const LocationCreateSchema = z.object({
	code: z.string().min(1).max(50),
	name: z.string().min(1).max(150),
	description: z.string().optional().nullable(),
	category: z.enum(["OFFICE", "NON_OFFICE"]),
	address: z.string().optional().nullable(),
	isActive: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
});

export const LocationUpdateSchema = z.object({
	code: z.string().min(1).max(50).optional(),
	name: z.string().min(1).max(150).optional(),
	description: z.string().optional().nullable(),
	category: z.enum(["OFFICE", "NON_OFFICE"]).optional(),
	address: z.string().optional().nullable(),
	isActive: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
});
