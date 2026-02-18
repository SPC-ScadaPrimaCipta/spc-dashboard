"use client";

import { useEffect, useRef, useState } from "react";
import {
	format,
	getDaysInMonth,
	addMonths,
	subMonths,
	isSameDay,
} from "date-fns";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	Download,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollBar } from "@/components/ui/scroll-area";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";
import { MonthPicker } from "@/components/month-picker";
import { ActivityUpdateModal } from "./task-update-modal";
import { ActivityDetailsModal } from "./task-detail-modal";
import { CreateTaskModal } from "./task-create-modal";

interface Task {
	id: string;
	title: string;
	startAt: string | null;
	endAt: string | null;
	color?: string | null;
	status: {
		name: string;
		color: string;
	};
	assignments: Array<{
		assignee: {
			id: string;
			name: string;
			image: string | null;
		};
	}>;
	// Add other fields as needed
}

export function GanttChart() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [employees, setEmployees] = useState<any[]>([]);
	const [tasks, setTasks] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [selectedActivity, setSelectedActivity] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const fetchSchedule = async () => {
		setLoading(true);

		const startOfMonth = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			1,
		);
		const endOfMonth = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() + 1,
			0,
		);

		// Adjust to include the full day
		endOfMonth.setHours(23, 59, 59, 999);

		try {
			const response = await fetch(
				`/api/tasks?from=${startOfMonth.toISOString()}&to=${endOfMonth.toISOString()}`,
			);

			if (!response.ok) {
				throw new Error("Failed to fetch");
			}

			const result = await response.json();

			if (!result.ok || !result.data) {
				setEmployees([]);
				setTasks([]);
				setLoading(false);
				return;
			}

			const fetchedTasks: Task[] = result.data;

			// Process tasks
			const processedTasks = fetchedTasks
				.map((task) => ({
					...task,
					startDate: task.startAt ? new Date(task.startAt) : null,
					endDate: task.endAt ? new Date(task.endAt) : null,
				}))
				.filter((t) => t.startDate && t.endDate); // Filter out tasks without dates for now

			// Extract unique employees from assignments
			const uniqueEmployeesMap = new Map();
			fetchedTasks.forEach((task) => {
				task.assignments.forEach((assignment) => {
					if (assignment.assignee) {
						uniqueEmployeesMap.set(
							assignment.assignee.id,
							assignment.assignee,
						);
					}
				});
			});

			// Convert to array and add a placeholder for Unassigned if needed (though we only show rows for assignees here)
			setEmployees(Array.from(uniqueEmployeesMap.values()));
			setTasks(processedTasks);
		} catch (error) {
			console.error("Error fetching schedule data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSchedule();
	}, [currentDate]);

	const daysInCurrentMonth = getDaysInMonth(currentDate);
	const dates = Array.from(
		{ length: daysInCurrentMonth },
		(_, i) =>
			new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1),
	);

	const handleMonthChange = (direction: "prev" | "next") => {
		setCurrentDate((prev) =>
			direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
		);
	};

	const handleDateSelect = (date: Date) => {
		setCurrentDate(date);
	};

	const handleExport = () => {
		const startOfMonth = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			1,
		);
		const endOfMonth = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() + 1,
			0,
		);
		endOfMonth.setHours(23, 59, 59, 999);

		const query = new URLSearchParams({
			from: startOfMonth.toISOString(),
			to: endOfMonth.toISOString(),
			format: "xlsx",
		});

		window.location.href = `/api/tasks/export?${query.toString()}`;
	};

	const showActivityDetails = (activity: any) => {
		setSelectedActivity({
			...activity,
			formattedStartDate: activity.startDate
				? format(activity.startDate, "PPP")
				: "N/A",
			formattedEndDate: activity.endDate
				? format(activity.endDate, "PPP")
				: "N/A",
		});
		setIsModalOpen(true);
	};

	const normalizeDate = (d: Date) =>
		new Date(d.getFullYear(), d.getMonth(), d.getDate());

	const isEmployeeTask = (task: any, employeeId: string) => {
		return (
			task.assignments &&
			task.assignments.some((a: any) => a.assignee.id === employeeId)
		);
	};

	const getEmployeeLanes = (employee: any) => {
		const empTasks = tasks.filter((t) => isEmployeeTask(t, employee.id));
		empTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

		const lanes: any[][] = [];

		empTasks.forEach((task) => {
			let placed = false;
			for (let i = 0; i < lanes.length; i++) {
				const lane = lanes[i];
				const lastTask = lane[lane.length - 1];

				if (
					normalizeDate(task.startDate) >
					normalizeDate(lastTask.endDate)
				) {
					lane.push(task);
					placed = true;
					break;
				}
			}
			if (!placed) {
				lanes.push([task]);
			}
		});

		return lanes.length > 0 ? lanes : [[]];
	};

	const renderEmployeeRow = (employee: any) => {
		const lanes = getEmployeeLanes(employee);
		const rowSpan = lanes.length;

		// Calculate total days
		const totalDays = lanes.flat().reduce((acc, task) => {
			const viewStart = dates[0];
			const viewEnd = dates[dates.length - 1];

			// Clamp task dates to view
			const taskStart = normalizeDate(task.startDate);
			const taskEnd = normalizeDate(task.endDate);
			const start = taskStart < viewStart ? viewStart : taskStart;
			const end = taskEnd > viewEnd ? viewEnd : taskEnd;

			if (start > end) return acc;

			const days =
				Math.floor(
					(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
				) + 1;
			return acc + days;
		}, 0);

		return lanes.map((laneTasks, laneIndex) => {
			let skipDays = 0;
			const cells = [];

			for (let i = 0; i < dates.length; i++) {
				if (skipDays > 0) {
					skipDays--;
					continue;
				}

				const date = dates[i];
				const normDate = normalizeDate(date);

				const task = laneTasks.find((t) => {
					const start = normalizeDate(t.startDate);
					const end = normalizeDate(t.endDate);
					return normDate >= start && normDate <= end;
				});

				if (task) {
					const taskEnd = normalizeDate(task.endDate);
					let span = 0;
					const copyDate = new Date(normDate);

					while (
						copyDate <= taskEnd &&
						copyDate.getMonth() === currentDate.getMonth()
					) {
						span++;
						copyDate.setDate(copyDate.getDate() + 1);
					}

					skipDays = span - 1;

					// Color preference: task.color -> status defaults -> theme
					let colorClass = "bg-primary text-primary-foreground";
					let taskStyle = {};

					if (task.color) {
						colorClass = "text-white";
						taskStyle = { backgroundColor: task.color };
					} else if (task.status?.name === "Done") {
						colorClass = "bg-green-500 text-white";
					} else if (task.status?.name === "In Progress") {
						colorClass = "bg-blue-500 text-white";
					}

					cells.push(
						<td
							key={`${employee.id}-${laneIndex}-${date.toISOString()}`}
							colSpan={span}
							className="border-r border-b border-border p-0 h-16 min-w-[50px] relative align-top"
						>
							<Tooltip delayDuration={200}>
								<TooltipTrigger asChild>
									<div
										className={cn(
											colorClass,
											"m-1 rounded-md text-xs flex items-center justify-center cursor-pointer shadow-sm hover:opacity-90 transition-all h-[calc(100%-8px)]",
										)}
										style={taskStyle}
										onClick={() =>
											showActivityDetails(task)
										}
									>
										<div className="px-2 truncate w-full text-center font-medium">
											{task.title}
										</div>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>
										{task.title} - {task.status?.name}
									</p>
								</TooltipContent>
							</Tooltip>
						</td>,
					);
				} else {
					cells.push(
						<td
							key={`${employee.id}-${laneIndex}-${date.toISOString()}`}
							className={`border-r border-b border-border p-0 h-16 min-w-[40px] ${[0, 6].includes(date.getDay()) ? "bg-red-50/30 dark:bg-red-900/10" : "bg-background"}`}
						></td>,
					);
				}
			}

			return (
				<tr
					key={`${employee.id}-${laneIndex}`}
					className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors"
				>
					{laneIndex === 0 && (
						<td
							className="sticky left-0 z-20 bg-background border-r border-b border-border px-4 py-2 min-w-[200px] max-w-[200px] align-top"
							rowSpan={rowSpan}
						>
							<div className="flex justify-between items-start h-full pt-2">
								<span
									className="font-medium text-sm truncate pr-2 text-foreground"
									title={employee.name}
								>
									{employee.name}
								</span>
								<Badge
									variant="secondary"
									className="text-[10px] px-1 py-0 h-5 whitespace-nowrap"
								>
									{totalDays}d
								</Badge>
							</div>
						</td>
					)}
					{cells}
				</tr>
			);
		});
	};

	return (
		<div className="w-full h-full bg-background dark:bg-zinc-950 rounded-xl shadow-sm border border-border flex flex-col overflow-hidden">
			<div className="p-4 border-b border-border flex justify-between items-center bg-muted/20 dark:bg-zinc-900/50">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1 bg-background dark:bg-zinc-900 rounded-md border border-border p-0.5 shadow-sm">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-sm text-foreground"
							onClick={() => handleMonthChange("prev")}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>

						{/* Use the new MonthPicker component */}
						<MonthPicker
							currentDate={currentDate}
							onMonthChange={handleDateSelect}
							className="w-[160px]"
						/>

						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-sm text-foreground"
							onClick={() => handleMonthChange("next")}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" onClick={handleExport}>
						<Download className="h-4 w-4 mr-2" /> Export
					</Button>
					<Button
						size="sm"
						onClick={() => setIsCreateModalOpen(true)}
					>
						<Plus className="h-4 w-4 mr-2" /> Create Task
					</Button>
					{/* Legend placeholders */}
					{/* <div className="flex gap-4 text-xs text-muted-foreground">
						<div className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>{" "}
							In Progress
						</div>
						<div className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>{" "}
							Done
						</div>
					</div> */}
				</div>
			</div>

			{loading ? (
				<div className="h-64 flex items-center justify-center text-muted-foreground bg-background">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : employees.length === 0 ? (
				<div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background">
					<p>No tasks found for this period.</p>
					<Button onClick={() => setIsCreateModalOpen(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Create Task
					</Button>
				</div>
			) : (
				<TooltipProvider>
					<ScrollAreaPrimitive.Root
						className="flex-1 w-full relative overflow-hidden min-h-0 bg-background"
						ref={scrollContainerRef}
					>
						<ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
							<div className="min-w-max">
								<table className="w-full border-separate border-spacing-0">
									<thead className="sticky top-0 z-30 bg-muted/50 dark:bg-zinc-900 shadow-sm">
										<tr>
											<th className="sticky left-0 z-40 bg-muted/50 dark:bg-zinc-900 border-r border-b border-border h-[45px] w-[200px] min-w-[200px] px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
												Person
											</th>
											{dates.map((date) => (
												<th
													key={date.toISOString()}
													className="h-[45px] w-[50px] min-w-[50px] border-r border-b border-border bg-muted/50 dark:bg-zinc-900 text-xs font-semibold text-muted-foreground p-1 text-center"
												>
													<div className="flex flex-col items-center justify-center h-full">
														<span className="text-[10px] uppercase text-muted-foreground/70">
															{format(
																date,
																"EEE",
															)}
														</span>
														<span
															className={cn(
																"text-sm font-medium",
																[0, 6].includes(
																	date.getDay(),
																)
																	? "text-red-500 dark:text-red-400"
																	: "text-foreground",
															)}
														>
															{date.getDate()}
														</span>
													</div>
												</th>
											))}
										</tr>
									</thead>
									<tbody className="bg-background">
										{employees.map(renderEmployeeRow)}
									</tbody>
								</table>
							</div>
						</ScrollAreaPrimitive.Viewport>
						<ScrollBar orientation="horizontal" />
						<ScrollBar orientation="vertical" />
						<ScrollAreaPrimitive.Corner />
					</ScrollAreaPrimitive.Root>
				</TooltipProvider>
			)}

			<ActivityDetailsModal
				isVisible={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				activity={selectedActivity}
				onEdit={() => {
					setIsModalOpen(false);
					setIsUpdateModalOpen(true);
				}}
			/>

			<ActivityUpdateModal
				isVisible={isUpdateModalOpen}
				onClose={() => setIsUpdateModalOpen(false)}
				activity={selectedActivity}
				onUpdate={fetchSchedule}
			/>

			<CreateTaskModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onTaskCreated={fetchSchedule}
			/>
		</div>
	);
}
