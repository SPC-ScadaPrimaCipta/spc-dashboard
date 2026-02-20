import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ScheduleNavigationProps {
	view: "Day" | "Week" | "Month" | "Year";
	handleViewChange: (v: "Day" | "Week" | "Month" | "Year") => void;
	handleNavigate: (direction: "prev" | "next" | "today") => void;
	startDate: any;
	resourceType: string;
	setResourceType: (rt: string) => void;
}

export const ScheduleNavigation: React.FC<ScheduleNavigationProps> = ({
	view,
	handleViewChange,
	handleNavigate,
	startDate,
	resourceType,
	setResourceType,
}) => {
	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 sm:p-2 rounded-lg border shadow-sm w-full">
			{/* Mobile 1st Line / Desktop Left Side */}
			<div className="flex items-center gap-2 justify-between w-full sm:w-auto">
				<div className="flex items-center bg-gray-100 rounded-lg p-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleNavigate("prev")}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						onClick={() => handleNavigate("today")}
						className="px-3 text-sm font-medium"
					>
						Today
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleNavigate("next")}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<div className="font-medium text-lg ml-2 whitespace-nowrap hidden sm:block">
					{view === "Day" && startDate.toString("MMMM d, yyyy")}
					{view === "Week" &&
						`${startDate.toString("MMMM d")} - ${startDate.addDays(6).toString("MMMM d, yyyy")}`}
					{view === "Month" && startDate.toString("MMMM yyyy")}
					{view === "Year" && startDate.toString("yyyy")}
				</div>

				{/* Mobile view logic for center date */}
				<div className="font-medium text-base ml-2 whitespace-nowrap sm:hidden block truncate flex-1 text-center">
					{view === "Day" && startDate.toString("MMMM d, yyyy")}
					{view === "Week" &&
						`${startDate.toString("MMMM d")} - ${startDate.addDays(6).toString("MM d, yyyy")}`}
					{view === "Month" && startDate.toString("MMMM yyyy")}
					{view === "Year" && startDate.toString("yyyy")}
				</div>

				<Button
					asChild
					variant="outline"
					size="sm"
					className="ml-2 sm:hidden flex whitespace-nowrap"
				>
					<Link href="/resources">Manage</Link>
				</Button>
			</div>

			{/* Middle layout for desktop, 2nd line for mobile: Filter Types */}
			<div className="flex w-full sm:w-auto shrink-0 sm:hidden">
				<div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 w-full">
					{["ROOM", "PEOPLE", "VEHICLE"].map((rt) => (
						<Button
							key={rt}
							variant={resourceType === rt ? "default" : "ghost"}
							size="sm"
							onClick={() => setResourceType(rt)}
							className={`flex-1 ${resourceType === rt ? "shadow-sm" : ""}`}
						>
							{rt}
						</Button>
					))}
				</div>
			</div>

			<div className="hidden sm:flex flex-row items-center justify-center w-full max-w-sm">
				<div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
					{["ROOM", "PEOPLE", "VEHICLE"].map((rt) => (
						<Button
							key={rt}
							variant={resourceType === rt ? "default" : "ghost"}
							size="sm"
							onClick={() => setResourceType(rt)}
							className={resourceType === rt ? "shadow-sm" : ""}
						>
							{rt}
						</Button>
					))}
				</div>
				<Button asChild variant="outline" size="sm">
					<Link href="/resources">Manage Resource</Link>
				</Button>
			</div>

			{/* Views (Right side desktop, 3rd line mobile) */}
			<div className="flex w-full sm:w-auto">
				<div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 w-full overflow-x-auto">
					{(["Day", "Week", "Month", "Year"] as const).map((v) => (
						<Button
							key={v}
							variant={view === v ? "default" : "ghost"}
							size="sm"
							onClick={() => handleViewChange(v)}
							className={`flex-1 sm:flex-none ${view === v ? "shadow-sm" : ""}`}
						>
							{v}
						</Button>
					))}
				</div>
			</div>
		</div>
	);
};
