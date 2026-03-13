"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface YearPickerProps {
	currentYear: number;
	onYearChange: (year: number) => void;
	className?: string;
}

export function YearPicker({
	currentYear,
	onYearChange,
	className,
}: YearPickerProps) {
	const [viewStartYear, setViewStartYear] = React.useState(
		Math.floor(currentYear / 10) * 10,
	);
	const [isPickerOpen, setIsPickerOpen] = React.useState(false);

	return (
		<Popover
			open={isPickerOpen}
			onOpenChange={(open) => {
				setIsPickerOpen(open);
				if (open) setViewStartYear(Math.floor(currentYear / 10) * 10);
			}}
		>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-[120px] justify-start text-left font-normal",
						className,
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{currentYear}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="center">
				<div className="flex items-center justify-between mb-2">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setViewStartYear((prev) => prev - 10)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<div className="font-semibold text-sm">
						{viewStartYear} - {viewStartYear + 11}
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setViewStartYear((prev) => prev + 10)}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<div className="grid grid-cols-4 gap-2">
					{Array.from({ length: 12 }, (_, i) => {
						const year = viewStartYear + i;
						const isCurrentYear = year === currentYear;

						return (
							<Button
								key={year}
								variant={isCurrentYear ? "default" : "ghost"}
								size="sm"
								className={cn(
									"h-8 text-xs",
									isCurrentYear && "font-bold",
								)}
								onClick={() => {
									onYearChange(year);
									setIsPickerOpen(false);
								}}
							>
								{year}
							</Button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
