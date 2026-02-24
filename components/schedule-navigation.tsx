import React, { useEffect, useState } from "react";
import {
	ChevronLeft,
	ChevronRight,
	Settings,
	Building,
	Users,
	Car,
	Download,
	Filter,
	Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const RESOURCE_TYPES = [
	{ id: "PEOPLE", label: "People", icon: Users },
	{ id: "VEHICLE", label: "Vehicles", icon: Car },
	{ id: "ROOM", label: "Rooms", icon: Building },
] as const;
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface ScheduleNavigationProps {
	view: "Day" | "Week" | "Month" | "Year";
	handleViewChange: (v: "Day" | "Week" | "Month" | "Year") => void;
	handleNavigate: (direction: "prev" | "next" | "today") => void;
	startDate: any;
	resourceType: string;
	setResourceType: (rt: string) => void;
	onExport?: (format: "json" | "xlsx") => void;
	useInitials: boolean;
	setUseInitials: (v: boolean) => void;
	selectedDivisions: string[];
	setSelectedDivisions: (divs: string[]) => void;
}

export const ScheduleNavigation: React.FC<ScheduleNavigationProps> = ({
	view,
	handleViewChange,
	handleNavigate,
	startDate,
	resourceType,
	setResourceType,
	onExport,
	useInitials,
	setUseInitials,
	selectedDivisions,
	setSelectedDivisions,
}) => {
	const [divisions, setDivisions] = useState<
		{ code: string; name: string }[]
	>([]);

	useEffect(() => {
		if (resourceType === "PEOPLE") {
			fetch("/api/divisions")
				.then((r) => r.json())
				.then((data) => setDivisions(data))
				.catch(() => {});
		}
	}, [resourceType]);

	const toggleDivision = (code: string) => {
		if (selectedDivisions.includes(code)) {
			setSelectedDivisions(selectedDivisions.filter((d) => d !== code));
		} else {
			setSelectedDivisions([...selectedDivisions, code]);
		}
	};

	const renderFilterMenu = (triggerClassName: string) => (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={triggerClassName}
				>
					<Filter className="h-4 w-4 mr-2" />
					<span>Filter by Division</span>
					{selectedDivisions.length > 0 && (
						<span className="ml-1 shrink-0 bg-primary w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground text-xs">
							{selectedDivisions.length}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-56 p-2" align="start">
				<div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
					<div className="px-2 py-1.5 text-sm font-semibold">
						Divisions
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="justify-start gap-2"
						onClick={() => setSelectedDivisions([])}
					>
						<div className="w-4 flex items-center">
							{selectedDivisions.length === 0 && (
								<Check className="h-3 w-3" />
							)}
						</div>
						All Divisions
					</Button>
					{divisions.map((d) => (
						<Button
							key={d.code!}
							variant="ghost"
							size="sm"
							className="justify-start gap-2"
							onClick={() => d.code && toggleDivision(d.code)}
						>
							<div className="w-4 flex items-center">
								{selectedDivisions.includes(d.code!) && (
									<Check className="h-3 w-3" />
								)}
							</div>
							{d.name}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background text-foreground p-2 sm:p-2 rounded-lg border shadow-sm w-full">
			{/* Mobile 1st Line / Desktop Left Side */}
			<div className="flex items-center gap-2 justify-between w-full sm:w-auto">
				<div className="flex items-center bg-muted rounded-lg p-1">
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

				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="icon"
							className="ml-2 sm:hidden flex shrink-0"
						>
							<span className="sr-only">Settings</span>
							<Settings className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-48 p-2" align="start">
						<div className="flex flex-col gap-1">
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="justify-start"
							>
								<Link href="/resources">Manage Resources</Link>
							</Button>
							<label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-md">
								<input
									type="checkbox"
									checked={useInitials}
									onChange={(e) =>
										setUseInitials(e.target.checked)
									}
									className="rounded border-gray-300"
								/>
								Use Initials
							</label>
						</div>
					</PopoverContent>
				</Popover>

				{/* Desktop Filter */}
				{resourceType === "PEOPLE" &&
					renderFilterMenu("hidden sm:flex shrink-0 h-9 ml-2 px-3")}
			</div>

			{/* Mobile Filter: shows above type tabs */}
			{resourceType === "PEOPLE" && (
				<div className="flex w-full sm:hidden">
					{renderFilterMenu("flex w-full justify-center h-9")}
				</div>
			)}

			{/* Middle layout for desktop, 2nd line for mobile: Filter Types */}
			<div className="flex w-full sm:w-auto shrink-0 sm:hidden">
				<div className="flex items-center justify-center bg-muted rounded-lg p-1 w-full gap-1">
					{RESOURCE_TYPES.map(({ id, label, icon: Icon }) => (
						<Tooltip key={id}>
							<TooltipTrigger asChild>
								<Button
									variant={
										resourceType === id
											? "default"
											: "ghost"
									}
									size="sm"
									onClick={() => setResourceType(id)}
									className={`flex-1 ${resourceType === id ? "shadow-sm" : ""}`}
								>
									<Icon className="h-4 w-4 mr-2" />
									<span>{label}</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{label}</p>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
			</div>

			<div className="hidden sm:flex flex-row items-center justify-center w-full max-w-sm">
				<div className="flex items-center bg-muted rounded-lg p-1 mr-4 gap-1">
					{RESOURCE_TYPES.map(({ id, label, icon: Icon }) => (
						<Tooltip key={id}>
							<TooltipTrigger asChild>
								<Button
									variant={
										resourceType === id
											? "default"
											: "ghost"
									}
									size="sm"
									onClick={() => setResourceType(id)}
									className={`h-8 px-3 ${resourceType === id ? "shadow-sm" : ""}`}
								>
									<Icon className="h-4 w-4 mr-2" />
									<span>{label}</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{label}</p>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="icon"
							className="shrink-0"
						>
							<span className="sr-only">Settings</span>
							<Settings className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-48 p-2" align="end">
						<div className="flex flex-col gap-1">
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="justify-start"
							>
								<Link href="/resources">Manage Resources</Link>
							</Button>
							<label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-md">
								<input
									type="checkbox"
									checked={useInitials}
									onChange={(e) =>
										setUseInitials(e.target.checked)
									}
									className="rounded border-gray-300"
								/>
								Use Initials
							</label>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* Views & Export (Right side desktop, 3rd line mobile) */}
			<div className="flex items-center gap-2 w-full sm:w-auto">
				<div className="flex items-center justify-center bg-muted rounded-lg p-1 w-full overflow-x-auto">
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
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="icon"
							className="shrink-0 h-9 w-9"
						>
							<span className="sr-only">Export Schedule</span>
							<Download className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-40 p-1" align="end">
						<div className="flex flex-col gap-1">
							<Button
								variant="ghost"
								size="sm"
								className="justify-start"
								onClick={() => onExport?.("xlsx")}
							>
								Export as XLSX
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="justify-start"
								onClick={() => onExport?.("json")}
							>
								Export as JSON
							</Button>
						</div>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
};
