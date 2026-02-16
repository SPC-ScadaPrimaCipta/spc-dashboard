"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";

export type MonitorItem = {
	id: string;
	title: string;
	status: "PENDING" | "APPROVED" | "REJECTED";
	currentStep: string;
	createdBy?: {
		name: string | null;
		email: string | null;
		image: string | null;
	};
	createdAt: string;
	updatedAt: string;
};

export const columns: ColumnDef<MonitorItem>[] = [
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Title" />
		),
	},
	{
		accessorKey: "createdBy",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Submitted By" />
		),
		cell: ({ row }) => {
			const user = row.original.createdBy;
			return (
				<div className="flex flex-col">
					<span className="font-medium text-sm">
						{user?.name || "Unknown"}
					</span>
					<span className="text-xs text-muted-foreground">
						{user?.email}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "currentStep",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Current Step" />
		),
		cell: ({ row }) => {
			return (
				<div className="flex items-center">
					<span className="font-medium text-muted-foreground">
						{row.getValue("currentStep")}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge
					variant={
						status === "APPROVED"
							? "secondary"
							: status === "REJECTED"
							? "destructive"
							: "outline"
					}
					className={
						status === "APPROVED"
							? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
							: ""
					}
				>
					{status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Submitted Date" />
		),
		cell: ({ row }) => {
			return new Date(row.getValue("createdAt")).toLocaleDateString();
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const item = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(item.id)
							}
						>
							Copy ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View details</DropdownMenuItem>
						<DropdownMenuItem>Audit Log</DropdownMenuItem>
						{item.status === "PENDING" && (
							<DropdownMenuItem className="text-red-600">
								Force Cancel
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
