"use client";

import { usePathname } from "next/navigation";
import { ScheduleTabs } from "./schedule-tabs";

export default function ScheduleLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isTaskDetail = pathname?.includes("/task/");

	if (isTaskDetail) {
		return <div className="h-full flex flex-col">{children}</div>;
	}

	return (
		<div className="flex flex-col h-full p-6 space-y-6">
			<div className="flex flex-col space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
				<p className="text-muted-foreground">
					Manage and view tasks in different layouts.
				</p>
			</div>
			<div className="flex flex-col h-full">
				<ScheduleTabs />
				<div className="flex-1 h-full min-h-0 overflow-hidden">
					{children}
				</div>
			</div>
		</div>
	);
}
