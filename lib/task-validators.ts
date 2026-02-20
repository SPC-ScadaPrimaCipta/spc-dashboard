import { z } from "zod";

export const TaskStatusCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	isTerminal: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
	isActive: z.boolean().optional(),
});

export const TaskStatusUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	isTerminal: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
	isActive: z.boolean().optional(),
});

export const LabelCreateSchema = z.object({
	name: z.string().min(1),
	color: z.string().optional(),
});

export const LabelUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	color: z.string().optional(),
});

export const TaskCreateSchema = z
	.object({
		title: z.string().min(1),
		description: z.string().optional(),
		type: z.enum(["TASK", "MILESTONE", "SUMMARY"]).optional(),
		priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
		statusId: z.string().uuid(),
		startAt: z.string().datetime({ offset: true }).optional().nullable(),
		endAt: z.string().datetime({ offset: true }).optional().nullable(),
		durationMin: z.number().int().min(0).optional().nullable(),
		allDay: z.boolean().optional(),
		timezone: z.string().optional(),
		color: z.string().optional(),
		assigneeIds: z.array(z.string()).optional(),
		labelSlugs: z.array(z.string()).optional(),
		resourceId: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.startAt && data.endAt) {
				const start = new Date(data.startAt);
				const end = new Date(data.endAt);
				if (end < start) return false;
			}
			return true;
		},
		{
			message: "End date must be after start date",
			path: ["endAt"],
		},
	);

export const TaskUpdateSchema = z
	.object({
		title: z.string().min(1).optional(),
		description: z.string().optional().nullable(),
		type: z.enum(["TASK", "MILESTONE", "SUMMARY"]).optional(),
		priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
		statusId: z.string().uuid().optional(),
		startAt: z.string().datetime({ offset: true }).optional().nullable(),
		endAt: z.string().datetime({ offset: true }).optional().nullable(),
		durationMin: z.number().int().min(0).optional().nullable(),
		allDay: z.boolean().optional(),
		timezone: z.string().optional().nullable(),
		color: z.string().optional().nullable(),
		assigneeIds: z.array(z.string()).optional(),
		labelSlugs: z.array(z.string()).optional(),
		resourceId: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.startAt && data.endAt) {
				const start = new Date(data.startAt);
				const end = new Date(data.endAt);
				if (end < start) return false;
			}
			return true;
		},
		{
			message: "End date must be after start date",
			path: ["endAt"],
		},
	);

export const CommentCreateSchema = z.object({
	body: z.string().min(1),
});
