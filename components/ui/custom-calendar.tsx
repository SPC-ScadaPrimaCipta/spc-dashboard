"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	add,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	getDay,
	isEqual,
	isSameDay,
	isSameMonth,
	isToday,
	parse,
	startOfToday,
	startOfWeek,
	startOfMonth,
	addMonths,
	subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarProps = {
	mode?: "single";
	selected?: Date;
	onSelect?: (date: Date | undefined) => void;
	className?: string;
};

export function CustomCalendar({
	mode = "single",
	selected,
	onSelect,
	className,
}: CalendarProps) {
	let today = startOfToday();
	let [currentMonth, setCurrentMonth] = React.useState(
		format(today, "MMM-yyyy"),
	);
	let firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

	let days = eachDayOfInterval({
		start: startOfWeek(startOfMonth(firstDayCurrentMonth)),
		end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
	});

	function previousMonth() {
		let firstDayNextMonth = subMonths(firstDayCurrentMonth, 1);
		setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
	}

	function nextMonth() {
		let firstDayNextMonth = addMonths(firstDayCurrentMonth, 1);
		setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
	}

	return (
		<div className={cn("p-3", className)}>
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-gray-900 dark:text-gray-100 pl-4">
					{format(firstDayCurrentMonth, "MMMM yyyy")}
				</span>
				<div className="flex items-center space-x-1">
					<Button
						variant="ghost"
						size="icon"
						type="button"
						onClick={previousMonth}
						className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						type="button"
						onClick={nextMonth}
						className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
			<div className="mt-4 grid grid-cols-7 text-center text-xs leading-6 text-gray-500 dark:text-gray-400">
				<div>Su</div>
				<div>Mo</div>
				<div>Tu</div>
				<div>We</div>
				<div>Th</div>
				<div>Fr</div>
				<div>Sa</div>
			</div>
			<div className="mt-2 grid grid-cols-7 text-sm">
				{days.map((day, dayIdx) => (
					<div
						key={day.toString()}
						className={cn(
							dayIdx === 0 && colStartClasses[getDay(day)],
							"py-1",
						)}
					>
						<button
							type="button"
							onClick={() => onSelect?.(day)}
							className={cn(
								isSameDay(day, selected || new Date(0)) &&
									"text-white",
								!isSameDay(day, selected || new Date(0)) &&
									isToday(day) &&
									"text-red-500",
								!isSameDay(day, selected || new Date(0)) &&
									!isToday(day) &&
									isSameMonth(day, firstDayCurrentMonth) &&
									"text-gray-900 dark:text-gray-100",
								!isSameDay(day, selected || new Date(0)) &&
									!isToday(day) &&
									!isSameMonth(day, firstDayCurrentMonth) &&
									"text-gray-400 dark:text-gray-600",
								isSameDay(day, selected || new Date(0)) &&
									isToday(day) &&
									"bg-red-500",
								isSameDay(day, selected || new Date(0)) &&
									!isToday(day) &&
									"bg-gray-900 dark:bg-gray-100 dark:text-gray-900",
								!isSameDay(day, selected || new Date(0)) &&
									"hover:bg-gray-200 dark:hover:bg-gray-800",
								(isSameDay(day, selected || new Date(0)) ||
									isToday(day)) &&
									"font-semibold",
								"mx-auto flex h-8 w-8 items-center justify-center rounded-full",
							)}
						>
							<time dateTime={format(day, "yyyy-MM-dd")}>
								{format(day, "d")}
							</time>
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

let colStartClasses = [
	"",
	"col-start-2",
	"col-start-3",
	"col-start-4",
	"col-start-5",
	"col-start-6",
	"col-start-7",
];
