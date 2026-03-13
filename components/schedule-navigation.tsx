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
	Calendar,
	Maximize2,
	EyeOff,
	List,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const RESOURCE_TYPES = [
	{ id: "PEOPLE", label: "People", icon: Users },
	{ id: "TASK", label: "Tasks", icon: List },
	{ id: "VEHICLE", label: "Vehicles", icon: Car },
	{ id: "ROOM", label: "Rooms", icon: Building },
	{ id: "TIMEOFF", label: "Time Off", icon: Calendar },
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
import { useRequirePermission } from "@/hooks/use-require-permission";

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
	clipboard?: any;
	onCancelCopy?: () => void;
	isSimplified: boolean;
	setIsSimplified: (v: boolean) => void;
	locationCategory: string;
	setLocationCategory: (v: string) => void;
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
	clipboard,
	onCancelCopy,
	isSimplified,
	setIsSimplified,
	locationCategory,
	setLocationCategory,
}) => {
	const [divisions, setDivisions] = useState<
		{ code: string; name: string }[]
	>([]);
	const { isAuthorized: canManageResources } = useRequirePermission(
		"manage",
		"resources",
		{ redirect: false },
	);

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

	const renderFilterMenu = (className?: string) => (
		<Popover>
			<Tooltip>
				<TooltipTrigger asChild>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className={className}
						>
							<Filter className="h-4 w-4" />
							<span className="truncate inline xl:hidden">
								Filter
							</span>
							{(selectedDivisions.length > 0 ||
								locationCategory !== "ALL") && (
								<span className="ml-1 shrink-0 bg-primary w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground text-xs">
									{selectedDivisions.length +
										(locationCategory !== "ALL" ? 1 : 0)}
								</span>
							)}
						</Button>
					</PopoverTrigger>
				</TooltipTrigger>
				<TooltipContent>Filter</TooltipContent>
			</Tooltip>
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
						<div className="w-4 flex items-center shrink-0">
							{selectedDivisions.length === 0 && (
								<Check className="h-3 w-3" />
							)}
						</div>
						<span className="truncate text-left">All Divisions</span>
					</Button>
					{divisions.map((d) => (
						<Button
							key={d.code!}
							variant="ghost"
							size="sm"
							className="justify-start gap-2"
							onClick={() => d.code && toggleDivision(d.code)}
						>
							<div className="w-4 flex items-center shrink-0">
								{selectedDivisions.includes(d.code!) && (
									<Check className="h-3 w-3" />
								)}
							</div>
							<span className="truncate text-left">{d.name}</span>
						</Button>
					))}

					<div className="h-px bg-border my-1" />
					<div className="px-2 py-1.5 text-sm font-semibold">
						Location Category
					</div>
					{(["ALL", "OFFICE", "NON_OFFICE"] as const).map((cat) => (
						<Button
							key={cat}
							variant="ghost"
							size="sm"
							className="justify-start gap-2"
							onClick={() => setLocationCategory(cat)}
						>
							<div className="w-4 flex items-center shrink-0">
								{locationCategory === cat && (
									<Check className="h-3 w-3" />
								)}
							</div>
							<span className="truncate text-left">
								{cat === "ALL"
									? "All Locations"
									: cat === "OFFICE"
										? "Office"
										: "Non-Office"}
							</span>
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);

	const renderSettingsMenu = (
		align: "start" | "end" = "end",
		className?: string,
	) => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="icon" className={className}>
					<span className="sr-only">Settings</span>
					<Settings className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-56 p-2" align={align}>
				<div className="flex flex-col gap-1">
					<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Preferences
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="justify-start gap-2"
						onClick={() => setUseInitials(!useInitials)}
					>
						<div className="w-4 flex items-center justify-center shrink-0">
							{useInitials && <Check className="h-3.5 w-3.5" />}
						</div>
						Use Initials
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="justify-start gap-2"
						onClick={() => setIsSimplified(!isSimplified)}
					>
						<div className="w-4 flex items-center justify-center shrink-0">
							{isSimplified && <Check className="h-3.5 w-3.5" />}
						</div>
						Simplify Navigation
					</Button>

					{canManageResources && (
						<>
							<div className="h-px bg-border my-1" />

							<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Admin
							</div>
							<Button
								asChild
								variant="ghost"
								size="sm"
								className="justify-start gap-2"
							>
								<Link href="/resources">
									<Users className="h-3.5 w-3.5" />
									Manage Resources
								</Link>
							</Button>
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);

	return (
		<div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-background text-foreground p-2 rounded-lg border shadow-sm w-full">
			{/* Row 1: Left Group (Nav & Title) */}
			<div className="flex items-center gap-2 justify-between w-full xl:w-auto">
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

				<div className="font-medium text-base sm:text-lg ml-2 whitespace-nowrap text-center sm:text-left flex-1 xl:flex-none truncate">
					{view === "Day" && startDate.toString("MMMM d, yyyy")}
					{view === "Week" &&
						`${startDate.toString("MMMM d")} - ${startDate.addDays(6).toString("MMMM d, yyyy")}`}
					{view === "Month" && startDate.toString("MMMM yyyy")}
					{view === "Year" && startDate.toString("yyyy")}
				</div>

				<div className="xl:hidden flex gap-1">
					{renderSettingsMenu("end")}
				</div>
			</div>

			{/* Resource Type Center (Responsive) */}
			{!isSimplified && (
				<div className="flex items-center bg-muted rounded-lg p-1 w-full xl:w-auto xl:min-w-0 gap-1">
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
									className={`flex-1 xl:flex-none h-8 px-2 sm:px-3 ${resourceType === id ? "shadow-sm" : ""}`}
								>
									<Icon className="h-4 w-4 2xl:mr-2" />
									<span className="hidden 2xl:inline text-xs sm:text-sm">
										{label}
									</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{label}</p>
							</TooltipContent>
						</Tooltip>
					))}
				</div>
			)}

			{/* Right Actions & View Selection */}
			<div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
				{(resourceType === "PEOPLE" ||
					resourceType === "TIMEOFF" ||
					clipboard) &&
					!isSimplified && (
						<div className="flex items-center gap-2 w-full sm:w-auto">
							{(resourceType === "PEOPLE" ||
								resourceType === "TIMEOFF") &&
								renderFilterMenu(
									"flex-1 sm:flex-none h-9 px-3",
								)}
							{clipboard && (
								<Button
									variant="destructive"
									size="sm"
									onClick={onCancelCopy}
									className="flex-1 sm:flex-none h-9 px-3"
								>
									Cancel Copy
								</Button>
							)}
						</div>
					)}

				<div className="flex items-center gap-2 w-full sm:w-auto justify-between">
					{/* View Tabs */}
					{!isSimplified && (
						<div className="flex items-center bg-muted rounded-lg p-1 flex-1 sm:flex-none overflow-x-auto">
							{(["Day", "Week", "Month", "Year"] as const).map(
								(v) => (
									<Button
										key={v}
										variant={
											view === v ? "default" : "ghost"
										}
										size="sm"
										onClick={() => handleViewChange(v)}
										className={`flex-1 sm:flex-none h-8 px-3 ${view === v ? "shadow-sm" : ""}`}
									>
										{v}
									</Button>
								),
							)}
						</div>
					)}

					{/* Export & Desktop Settings */}
					<div className="flex items-center gap-1">
						{!isSimplified && (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="shrink-0 h-9 w-9"
									>
										<span className="sr-only">
											Export Schedule
										</span>
										<Download className="h-4 w-4" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-40 p-1"
									align="end"
								>
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
						)}
						<div className="hidden xl:block">
							{renderSettingsMenu("end")}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
