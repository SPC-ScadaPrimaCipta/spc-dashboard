"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ColorPicker, COLORS } from "@/components/color-picker";
import { UserSearchMultiSelect } from "@/components/user-search-multiselect";
import { LocationSearchSelect } from "@/components/location-search-select";
import { MapPin } from "lucide-react";

// Global counter for rotating color
let nextColorIndex = 0;

// Minimal Zod Schema
const quickCreateSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	code: z.string().optional().nullable(),
	assigneeIds: z.array(z.string()).optional(),
	locationId: z
		.string()
		.min(1, "Location is required")
		.uuid("Invalid location format"),
});

type QuickCreateFormValues = z.infer<typeof quickCreateSchema>;

interface TaskQuickCreateModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTaskCreated: () => void;
	resourceId?: string;
	resourceName?: string;
	startAt?: string; // ISO string from DayPilot
	endAt?: string; // ISO string from DayPilot
	view?: string; // To conditionally display time and end date
	resourceType?: string;
}

export function TaskQuickCreateModal({
	isOpen,
	onClose,
	onTaskCreated,
	resourceId,
	resourceName,
	startAt,
	endAt,
	view,
	resourceType,
}: TaskQuickCreateModalProps) {
	const [statusId, setStatusId] = useState<string>("");
	const [color, setColor] = useState<string>(COLORS[0].value);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors, dirtyFields },
	} = useForm<QuickCreateFormValues>({
		resolver: zodResolver(quickCreateSchema),
		defaultValues: {
			title: "",
			description: "",
			code: "",
			assigneeIds: [],
			locationId: undefined as any,
		},
	});

	const watchedTitle = watch("title");
	const watchAssigneeIds = watch("assigneeIds");

	useEffect(() => {
		if (isOpen && watchedTitle && !dirtyFields.code) {
			const codified = watchedTitle
				.toUpperCase()
				.trim()
				.replace(/[^A-Z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "");
			setValue("code", codified);
		}
	}, [watchedTitle, setValue, dirtyFields.code, isOpen]);

	// Fetch default status once
	useEffect(() => {
		if (isOpen) {
			reset();
			// Pick next color in rotation
			setColor(COLORS[nextColorIndex].value);
			nextColorIndex = (nextColorIndex + 1) % COLORS.length;

			const fetchDefaultStatus = async () => {
				try {
					const res = await fetch("/api/task-statuses");
					if (res.ok) {
						const data = await res.json();
						if (data.ok && data.data?.length > 0) {
							setStatusId(data.data[0].id);
						}
					}
				} catch (error) {
					console.error("Failed to fetch default status", error);
				}
			};

			if (!statusId) fetchDefaultStatus();
		}
	}, [isOpen, reset, statusId]);

	const onSubmit: SubmitHandler<QuickCreateFormValues> = async (data) => {
		if (!statusId) {
			toast.error("Default status is not configured.");
			return;
		}

		setIsSubmitting(true);
		try {
			let finalEndAt = endAt;
			const isAllDayCheck = view !== "Day";

			if (endAt && isAllDayCheck) {
				const endObj = new Date(endAt.replace("Z", ""));
				endObj.setMinutes(endObj.getMinutes() - 1);
				finalEndAt = format(endObj, "yyyy-MM-dd'T'HH:mm:ss") + ".000Z";
			}

			const payload = {
				...data,
				statusId,
				resourceId,
				startAt,
				endAt: finalEndAt,
				type: "TASK",
				priority: "MEDIUM",
				allDay: isAllDayCheck,
				color,
			};

			const response = await fetch("/api/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (!response.ok || !result.ok) {
				throw new Error(result.error || "Failed to create task");
			}

			// If we are in VEHICLE view and people are assigned, trigger a PATCH
			// to ensure the sync logic in the [id] route (assignments -> resources) is executed.
			if (
				resourceType === "VEHICLE" &&
				data.assigneeIds &&
				data.assigneeIds.length > 0
			) {
				const taskId = result.data.id;
				await fetch(`/api/tasks/${taskId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ assigneeIds: data.assigneeIds }),
				});
			}

			toast.success("Task quickly created");
			reset();
			onTaskCreated();
			onClose();
		} catch (error: any) {
			console.error("Create task error:", error);
			toast.error(error.message || "Failed to create task");
		} finally {
			setIsSubmitting(false);
		}
	};

	let formattedStart = "";
	let formattedEnd = "";
	const isAllDayLike = view && view !== "Day";

	if (startAt) {
		const startObj = new Date(startAt.replace("Z", ""));
		formattedStart = format(
			startObj,
			isAllDayLike ? "MMM d, yyyy" : "MMM d, yyyy h:mm a",
		);
	}
	if (endAt) {
		const endObj = new Date(endAt.replace("Z", ""));
		if (isAllDayLike) {
			endObj.setMinutes(endObj.getMinutes() - 1);
			formattedEnd = format(endObj, "MMM d, yyyy");
		} else {
			formattedEnd = format(endObj, "MMM d, yyyy h:mm a");
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Quick Create Task</DialogTitle>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4 mt-2"
				>
					<div className="bg-muted p-3 rounded-lg text-sm space-y-1">
						{resourceName && (
							<div className="flex justify-between">
								<span className="text-muted-foreground font-medium">
									Resource:
								</span>
								<span className="font-semibold">
									{resourceName}
								</span>
							</div>
						)}
						{formattedStart && formattedEnd && (
							<div className="flex justify-between">
								<span className="text-muted-foreground font-medium">
									Time:
								</span>
								<span className="text-right">
									{formattedStart} <br /> to {formattedEnd}
								</span>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input
							id="title"
							autoFocus
							{...register("title")}
							placeholder="Task title"
						/>
						{errors.title && (
							<p className="text-xs text-red-500">
								{errors.title.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							{...register("description")}
							placeholder="Brief description (optional)..."
						/>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<MapPin className="h-4 w-4" /> Location *
						</Label>
						<LocationSearchSelect
							selectedId={watch("locationId")}
							onChange={(id) =>
								setValue("locationId", id ?? "", {
									shouldValidate: true,
								})
							}
							placeholder="Select location..."
						/>
						{errors.locationId && (
							<p className="text-xs text-red-500">
								{errors.locationId.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="code">Code</Label>
						<Input
							id="code"
							{...register("code")}
							placeholder="e.g. task-id-123"
						/>
						<p className="text-[10px] text-muted-foreground uppercase tracking-widest">
							Auto-generated from title, but editable
						</p>
					</div>
					{resourceType === "VEHICLE" && (
						<div className="space-y-2">
							<Label>Person</Label>
							<UserSearchMultiSelect
								selectedIds={watchAssigneeIds || []}
								onChange={(ids) => setValue("assigneeIds", ids)}
								placeholder="Assign to..."
							/>
						</div>
					)}

					<div className="space-y-2">
						<Label>Color</Label>
						<ColorPicker value={color} onChange={setColor} />
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
