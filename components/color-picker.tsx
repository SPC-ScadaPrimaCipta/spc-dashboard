"use client";

import { cn } from "@/lib/utils";

export const COLORS = [
	{ name: "Blue", value: "#3b82f6" },
	{ name: "Red", value: "#ef4444" },
	{ name: "Green", value: "#22c55e" },
	{ name: "Yellow", value: "#eab308" },
	{ name: "Purple", value: "#a855f7" },
	{ name: "Pink", value: "#ec4899" },
	{ name: "Orange", value: "#f97316" },
	{ name: "Gray", value: "#6b7280" },
	// { name: "Slate", value: "#71717a" },
	// { name: "Zinc", value: "#18181b" },
];

interface ColorPickerProps {
	value: string | null;
	onChange: (value: string) => void;
	className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
	return (
		<div className={cn("flex flex-wrap items-center gap-1.5", className)}>
			{COLORS.map((c) => (
				<button
					key={c.value}
					type="button"
					onClick={() => onChange(c.value)}
					className={cn(
						"w-6 h-6 rounded-full border border-muted ring-offset-background transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
						value === c.value &&
							"ring-2 ring-ring ring-offset-2 scale-110",
					)}
					style={{
						backgroundColor: c.value,
					}}
					title={c.name}
				/>
			))}
		</div>
	);
}
