"use client";

import dynamic from "next/dynamic";

const Scheduler = dynamic(() => import("@/components/scheduler"), {
	ssr: false,
});
export default function SchedulePage() {
	return (
		<div className="h-full rounded-lg text-muted-foreground">
			<Scheduler />
		</div>
	);
}
