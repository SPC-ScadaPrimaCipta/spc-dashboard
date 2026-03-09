"use client";

import { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { getColumns, LocationRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LocationDialog } from "./location-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export default function LocationsPage() {
	const [data, setData] = useState<LocationRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedLocation, setSelectedLocation] =
		useState<LocationRow | null>(null);
	const [locationToDelete, setLocationToDelete] =
		useState<LocationRow | null>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			// Fetch all locations including inactive ones to allow management
			const res = await fetch("/api/locations?activeOnly=false");
			if (!res.ok) throw new Error("Failed to fetch locations");
			const json = await res.json();
			if (json.ok) {
				setData(json.data);
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to load locations");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleReorder = async (
		locationItem: LocationRow,
		direction: "up" | "down",
	) => {
		const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
		const idx = sorted.findIndex((t) => t.id === locationItem.id);

		if (direction === "up" && idx > 0) {
			const other = sorted[idx - 1];
			await performSwap(locationItem, other);
		} else if (direction === "down" && idx < sorted.length - 1) {
			const other = sorted[idx + 1];
			await performSwap(locationItem, other);
		}
	};

	const performSwap = async (itemA: LocationRow, itemB: LocationRow) => {
		try {
			const orderA = itemA.sortOrder;
			const orderB = itemB.sortOrder;

			await Promise.all([
				fetch(`/api/locations/${itemA.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sortOrder: orderB }),
				}),
				fetch(`/api/locations/${itemB.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sortOrder: orderA }),
				}),
			]);

			toast.success("Order updated");
			await fetchData();
		} catch (error) {
			console.error(error);
			toast.error("Failed to update order");
		}
	};

	const handleDelete = async () => {
		if (!locationToDelete) return;

		try {
			const res = await fetch(`/api/locations/${locationToDelete.id}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Location archived");
				fetchData();
			} else {
				throw new Error("Failed to delete");
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to archive location");
		} finally {
			setLocationToDelete(null);
		}
	};

	const columns = useMemo(
		() =>
			getColumns(
				(row) => handleReorder(row, "up"),
				(row) => handleReorder(row, "down"),
				(row) => {
					setSelectedLocation(row);
					setIsDialogOpen(true);
				},
				(row) => setLocationToDelete(row),
				data.length,
			),
		[data],
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Locations
					</h1>
					<p className="text-muted-foreground text-sm mt-1">
						Manage locations used in tasks constraints.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={() => {
							setSelectedLocation(null);
							setIsDialogOpen(true);
						}}
						className="shadow-sm"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Location
					</Button>
				</div>
			</div>

			{loading && data.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-slate-50/30 rounded-lg border border-dashed">
					<Loader2 className="h-8 w-8 animate-spin mb-2" />
					<span>Fetching current locations...</span>
				</div>
			) : (
				<DataTable columns={columns} data={data} filterKey="name" />
			)}

			<LocationDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				onSuccess={fetchData}
				initialData={selectedLocation}
			/>

			<ConfirmationDialog
				open={!!locationToDelete}
				onOpenChange={(open) => !open && setLocationToDelete(null)}
				title="Archive Location"
				description={`Are you sure you want to archive "${locationToDelete?.name}"? It will no longer be available for new assignments.`}
				confirmText="Archive"
				variant="destructive"
				onConfirm={handleDelete}
			/>
		</div>
	);
}
