"use client";

import { CalendarHeart } from "lucide-react";

export default function HolidaysPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Holidays</h1>
				<p className="text-muted-foreground mt-1">
					Manage public holidays and company-wide days off.
				</p>
			</div>

			<div className="flex flex-col items-center justify-center p-12 py-24 text-center border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 min-h-[400px]">
				<div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-100 dark:ring-zinc-800">
					<CalendarHeart className="h-10 w-10 text-muted-foreground" />
				</div>
				<h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
				<p className="text-muted-foreground max-w-sm mx-auto mb-6">
					The Holiday Management module is currently under
					construction. Check back later for updates!
				</p>
			</div>
		</div>
	);
}
