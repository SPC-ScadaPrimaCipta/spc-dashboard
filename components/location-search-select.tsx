"use client";

import { useEffect, useState, useMemo } from "react";
import {
	Check,
	ChevronsUpDown,
	Search,
	Plus,
	MapPin,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface LocationOption {
	id: string;
	name: string;
	code: string;
	category: "OFFICE" | "NON_OFFICE";
}

interface LocationSearchSelectProps {
	selectedId?: string;
	onChange: (id: string | undefined) => void;
	placeholder?: string;
}

export function LocationSearchSelect({
	selectedId,
	onChange,
	placeholder,
}: LocationSearchSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<LocationOption[]>([]);
	const [loading, setLoading] = useState(false);

	// For creating new location
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchOptions = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/locations");
			if (!res.ok) throw new Error("Failed to fetch locations");
			const json = await res.json();

			if (json.ok && Array.isArray(json.data)) {
				setOptions(json.data);
			} else {
				setOptions([]);
			}
		} catch (error) {
			console.error("Error fetching locations:", error);
			setOptions([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			fetchOptions();
		}
	}, [open]);

	const filteredOptions = useMemo(() => {
		if (!search) return options;
		return options.filter(
			(o) =>
				o.name.toLowerCase().includes(search.toLowerCase()) ||
				o.code.toLowerCase().includes(search.toLowerCase()),
		);
	}, [options, search]);

	const selectedOption = useMemo(() => {
		return options.find((o) => o.id === selectedId);
	}, [options, selectedId]);

	const handleCreateLocation = async () => {
		if (!search.trim()) return;

		setIsSubmitting(true);
		try {
			// Auto-generate code if search is used as name
			const code = search
				.trim()
				.toUpperCase()
				.replace(/\s+/g, "-")
				.slice(0, 50);

			const res = await fetch("/api/locations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: search.trim(),
					code,
					category: "NON_OFFICE",
					isActive: true,
				}),
			});

			const result = await res.json();
			if (!res.ok || !result.ok) {
				throw new Error(result.error || "Failed to create location");
			}

			const newLocation = result.data;
			setOptions((prev) => [...prev, newLocation]);
			onChange(newLocation.id);
			setSearch("");
			setOpen(false);
			toast.success(`Location "${newLocation.name}" created`);
		} catch (error: any) {
			console.error("Create location error:", error);
			toast.error(error.message || "Failed to create location");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between min-h-10 h-auto font-normal"
				>
					<div className="flex items-center gap-2 truncate">
						<MapPin className="h-4 w-4 shrink-0 opacity-50" />
						{selectedOption ? (
							<span className="truncate">
								{selectedOption.name}
							</span>
						) : (
							<span className="text-muted-foreground">
								{placeholder || "Select location..."}
							</span>
						)}
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] p-0" align="start">
				<div
					className="flex items-center border-b px-3 py-2"
					onPointerDown={(e) => e.stopPropagation()}
				>
					<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
					<Input
						placeholder="Search or create location..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								if (filteredOptions.length === 0 && search) {
									handleCreateLocation();
								}
							}
						}}
						className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0"
					/>
				</div>

				<div onPointerDown={(e) => e.stopPropagation()}>
					<ScrollArea className="h-[200px] p-1">
						{loading && options.length === 0 ? (
							<div className="space-y-2 p-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : filteredOptions.length === 0 ? (
							<div className="p-4 flex flex-col items-center justify-center text-center">
								<p className="text-sm text-muted-foreground mb-2">
									No locations found.
								</p>
								{search && (
									<Button
										variant="secondary"
										size="sm"
										onClick={handleCreateLocation}
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Plus className="mr-2 h-4 w-4" />
										)}
										Create "{search}"
									</Button>
								)}
							</div>
						) : (
							<div className="grid gap-1">
								{filteredOptions.map((option) => (
									<div
										key={option.id}
										className={cn(
											"flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
											selectedId === option.id
												? "bg-accent/50"
												: "",
										)}
										onClick={() => {
											onChange(option.id);
											setOpen(false);
										}}
									>
										<div
											className={cn(
												"flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												selectedId === option.id
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<Check className={cn("h-4 w-4")} />
										</div>
										<div className="flex flex-col">
											<span className="font-medium">
												{option.name}
											</span>
											<span className="text-[10px] text-muted-foreground uppercase tracking-widest">
												{option.category} •{" "}
												{option.code}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
				{selectedId && (
					<div className="p-1 border-t">
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
							onClick={() => {
								onChange(undefined);
								setOpen(false);
							}}
						>
							Clear Selection
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
