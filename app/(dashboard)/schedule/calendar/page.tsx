"use client";

import dynamic from "next/dynamic";

const Scheduler = dynamic(() => import("@/components/scheduler"), {
	ssr: false,
});

export default function CalendarPage() {
	return (
		<div className="h-full rounded-lg text-muted-foreground overflow-auto">
			<Scheduler />
		</div>
	);
}
