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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const quickCreateSchema = z.object({
	typeId: z.string().min(1, "Type is required"),
	reason: z.string().optional(),
	note: z.string().optional(),
});

type QuickCreateFormValues = z.infer<typeof quickCreateSchema>;

interface TimeOffQuickCreateModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreated: () => void;
	resourceId?: string;
	resourceName?: string;
	startAt?: string;
	endAt?: string;
	view?: string;
}

export function TimeOffQuickCreateModal({
	isOpen,
	onClose,
	onCreated,
	resourceId,
	resourceName,
	startAt,
	endAt,
	view,
}: TimeOffQuickCreateModalProps) {
	const [types, setTypes] = useState<any[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<QuickCreateFormValues>({
		resolver: zodResolver(quickCreateSchema),
		defaultValues: {
			typeId: "",
			reason: "",
			note: "",
		},
	});

	const selectedTypeId = watch("typeId");

	useEffect(() => {
		if (isOpen) {
			reset();
			const fetchTypes = async () => {
				try {
					const res = await fetch("/api/schedule/timeoff-types");
					if (res.ok) {
						const data = await res.json();
						if (data.ok) {
							setTypes(data.data || []);
							if (data.data?.length > 0) {
								setValue("typeId", data.data[0].id);
							}
						}
					}
				} catch (error) {
					console.error("Failed to fetch timeoff types", error);
				}
			};
			fetchTypes();
		}
	}, [isOpen, reset, setValue]);

	const onSubmit: SubmitHandler<QuickCreateFormValues> = async (data) => {
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
				resourceId,
				startAt,
				endAt: finalEndAt,
				status: "SUBMITTED",
				allDay: isAllDayCheck,
			};

			const response = await fetch("/api/timeoff", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (!response.ok || !result.ok) {
				throw new Error(
					result.error || "Failed to create time off request",
				);
			}

			toast.success("Time off request created");
			onCreated();
			onClose();
		} catch (error: any) {
			console.error("Create timeoff error:", error);
			toast.error(error.message || "Failed to create time off request");
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
					<DialogTitle>Quick Create Time Off</DialogTitle>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4 mt-2"
				>
					<div className="bg-muted p-3 rounded-lg text-sm space-y-1">
						{resourceName && (
							<div className="flex justify-between">
								<span className="text-muted-foreground font-medium">
									Requested For:
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
						<Label>Type *</Label>
						<Select
							value={selectedTypeId}
							onValueChange={(val) =>
								setValue("typeId", val, {
									shouldValidate: true,
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select type..." />
							</SelectTrigger>
							<SelectContent>
								{types.map((t) => (
									<SelectItem key={t.id} value={t.id}>
										<div className="flex items-center gap-2">
											<div
												className="w-2 h-2 rounded-full"
												style={{
													backgroundColor:
														t.color || "#ccc",
												}}
											/>
											{t.name}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.typeId && (
							<p className="text-xs text-red-500">
								{errors.typeId.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="reason">Reason</Label>
						<Input
							id="reason"
							{...register("reason")}
							placeholder="Brief reason (e.g. Vacation, Sick...)"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="note">Note</Label>
						<Textarea
							id="note"
							{...register("note")}
							placeholder="Additional details (optional)..."
							className="h-20 max-h-40"
						/>
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
