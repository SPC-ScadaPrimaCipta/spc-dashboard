"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

export function ScheduleTabs() {
	const router = useRouter();
	const pathname = usePathname();

	// Determine the current tab based on the path
	// If path is exactly /schedule or /schedule/gantt, use 'gantt'
	const currentTab = pathname.includes("/schedule/calendar")
		? "calendar"
		: pathname.includes("/schedule/task")
			? "task"
			: "gantt";

	const handleTabChange = (value: string) => {
		switch (value) {
			case "gantt":
				router.push("/schedule/gantt");
				break;
			case "calendar":
				router.push("/schedule/calendar");
				break;
			case "task":
				router.push("/schedule/task");
				break;
		}
	};

	return (
		<Tabs
			value={currentTab}
			onValueChange={handleTabChange}
			className="w-auto"
		>
			<TabsList>
				<TabsTrigger value="gantt">Gantt</TabsTrigger>
				<TabsTrigger value="calendar">Calendar</TabsTrigger>
				<TabsTrigger value="task">Task</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
