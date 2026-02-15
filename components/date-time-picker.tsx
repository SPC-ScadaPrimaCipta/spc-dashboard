"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
	includeTime?: boolean;
	className?: string;
	placeholder?: string;
}

export function DateTimePicker({
	date,
	setDate,
	includeTime = true,
	className,
	placeholder = "Pick a date",
}: DateTimePickerProps) {
	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) {
			setDate(undefined);
			return;
		}

		if (!date) {
			// If no date was selected before, just set the date with default time (start of day)
			// or if includeTime, maybe 9:00 AM? No, keep it start of day for consistency or current time?
			// Let's keep existing time if any, or default to 00:00
			const newDate = new Date(selectedDate);
			newDate.setHours(0, 0, 0, 0);
			setDate(newDate);
			return;
		}

		// Preserve time from previous date
		const newDate = new Date(selectedDate);
		if (includeTime) {
			newDate.setHours(date.getHours(), date.getMinutes());
		} else {
			newDate.setHours(0, 0, 0, 0);
		}
		setDate(newDate);
	};

	const handleTimeChange = (type: "hour" | "minute", value: string) => {
		if (!date) return;
		const newDate = new Date(date);
		if (type === "hour") {
			newDate.setHours(parseInt(value));
		} else if (type === "minute") {
			newDate.setMinutes(parseInt(value));
		}
		setDate(newDate);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={"outline"}
					className={cn(
						"w-full justify-start text-left font-normal",
						!date && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? (
						includeTime ? (
							format(date, "PPP p")
						) : (
							format(date, "PPP")
						)
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<CustomCalendar
					mode="single"
					selected={date}
					onSelect={handleDateSelect}
				/>
				{includeTime && (
					<div className="p-3 border-t border-border flex gap-2">
						<div className="flex-1">
							<Select
								value={date ? date.getHours().toString() : "0"}
								onValueChange={(val) =>
									handleTimeChange("hour", val)
								}
								disabled={!date}
							>
								<SelectTrigger>
									<Clock className="mr-2 h-4 w-4" />
									<SelectValue placeholder="Hour" />
								</SelectTrigger>
								<SelectContent className="h-48">
									{Array.from({ length: 24 }).map((_, i) => (
										<SelectItem
											key={i}
											value={i.toString()}
										>
											{i.toString().padStart(2, "0")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1">
							<Select
								value={
									date ? date.getMinutes().toString() : "0"
								}
								onValueChange={(val) =>
									handleTimeChange("minute", val)
								}
								disabled={!date}
							>
								<SelectTrigger>
									<SelectValue placeholder="Minute" />
								</SelectTrigger>
								<SelectContent className="h-48">
									{Array.from({ length: 60 }).map((_, i) => (
										<SelectItem
											key={i}
											value={i.toString()}
										>
											{i.toString().padStart(2, "0")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
