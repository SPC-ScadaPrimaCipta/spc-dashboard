"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface MonthPickerProps {
	currentDate: Date;
	onMonthChange: (date: Date) => void;
	className?: string;
}

export function MonthPicker({
	currentDate,
	onMonthChange,
	className = "",
}: MonthPickerProps) {
	const [pickerYear, setPickerYear] = React.useState(
		currentDate.getFullYear(),
	);
	const [isMonthPickerOpen, setIsMonthPickerOpen] = React.useState(false);

	return (
		<Popover
			open={isMonthPickerOpen}
			onOpenChange={(open) => {
				setIsMonthPickerOpen(open);
				if (open) setPickerYear(currentDate.getFullYear());
			}}
		>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className={`${className} px-3 font-semibold min-w-[140px] text-center text-sm h-8 hover:bg-muted`}
				>
					{format(currentDate, "MMMM yyyy")}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="center">
				<div className="flex items-center justify-between mb-2">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setPickerYear((prev) => prev - 1)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<div className="font-semibold text-sm">{pickerYear}</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setPickerYear((prev) => prev + 1)}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<div className="grid grid-cols-3 gap-2">
					{Array.from({ length: 12 }, (_, i) => {
						const monthDate = new Date(pickerYear, i, 1);
						const isCurrentMonth =
							i === currentDate.getMonth() &&
							pickerYear === currentDate.getFullYear();

						return (
							<Button
								key={i}
								variant={isCurrentMonth ? "default" : "ghost"}
								size="sm"
								className={cn(
									"h-8 text-xs",
									isCurrentMonth && "font-bold",
								)}
								onClick={() => {
									const newDate = new Date(currentDate);
									newDate.setFullYear(pickerYear);
									newDate.setMonth(i);
									onMonthChange(newDate);
									setIsMonthPickerOpen(false);
								}}
							>
								{format(monthDate, "MMM")}
							</Button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
