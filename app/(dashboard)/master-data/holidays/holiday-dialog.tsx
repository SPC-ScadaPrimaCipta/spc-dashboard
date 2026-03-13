"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/date-time-picker";

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

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function HolidayDialog({
	isOpen,
	onOpenChange,
	onSuccess,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const [startAt, setStartAt] = useState<Date | undefined>(undefined);
	const [endAt, setEndAt] = useState<Date | undefined>(undefined);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: "", description: "" },
	});

	useEffect(() => {
		if (isOpen) {
			reset();
			setStartAt(new Date());
			setEndAt(new Date());
		}
	}, [isOpen, reset]);

	const onSubmit: SubmitHandler<FormValues> = async (data) => {
		if (!startAt || !endAt) {
			toast.error("Please select start and end dates");
			return;
		}

		// Use manual time overriding to avoid timezone offset shifts changing the actual selected Day
		const formattedStart = new Date(
			Date.UTC(
				startAt.getFullYear(),
				startAt.getMonth(),
				startAt.getDate(),
				0,
				0,
				0,
			),
		);
		const formattedEnd = new Date(
			Date.UTC(
				endAt.getFullYear(),
				endAt.getMonth(),
				endAt.getDate(),
				23,
				59,
				59,
			),
		);

		let finalEnd = formattedEnd;
		if (finalEnd < formattedStart) {
			finalEnd = formattedStart;
		}

		try {
			const payload = {
				...data,
				startAt: formattedStart.toISOString(),
				endAt: finalEnd.toISOString(),
				allDay: true,
			};

			const res = await fetch("/api/holidays", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const resJson = await res.json();
			if (!res.ok || !resJson.ok) {
				throw new Error(resJson.error || "Failed to save holiday");
			}

			toast.success("Holiday created!");
			onSuccess();
			onOpenChange(false);
		} catch (error: any) {
			console.error(error);
			toast.error(error.message);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Add Holiday</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4 py-2"
				>
					<div className="space-y-2">
						<Label>Name *</Label>
						<Input
							{...register("name")}
							placeholder="Holiday name (e.g. New Year)"
							autoFocus
						/>
						{errors.name && (
							<p className="text-xs text-red-500">
								{errors.name.message}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Start Date</Label>
							<DateTimePicker
								date={startAt}
								setDate={(d) => {
									setStartAt(d);
									if (d && endAt && d > endAt) setEndAt(d);
								}}
								includeTime={false}
							/>
						</div>
						<div className="space-y-2">
							<Label>End Date</Label>
							<DateTimePicker
								date={endAt}
								setDate={setEndAt}
								minDate={startAt}
								includeTime={false}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Description</Label>
						<Textarea
							{...register("description")}
							placeholder="Optional description"
							className="resize-none"
						/>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
