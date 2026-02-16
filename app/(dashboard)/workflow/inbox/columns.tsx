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

import { useViewDetails } from "@/hooks/use-view-details";

export type InboxItem = {
	id: string;
	title: string;
	stepName: string;
	status: string;
	requestedBy: string;
	createdAt: string;
	refType: string;
	refId: string;
};

const ActionCell = ({ item }: { item: InboxItem }) => {
	const { handleViewDetails } = useViewDetails();

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
					onClick={() => navigator.clipboard.writeText(item.id)}
				>
					Copy ID
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => handleViewDetails(item.refType, item.refId)}
				>
					View details
				</DropdownMenuItem>
				{item.status === "PENDING" && (
					<>
						<DropdownMenuItem>Approve</DropdownMenuItem>
						<DropdownMenuItem className="text-red-600">
							Reject
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export const columns: ColumnDef<InboxItem>[] = [
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Workflow" />
		),
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium">{row.getValue("title")}</span>
				<span className="text-xs text-muted-foreground">
					{row.original.stepName}
				</span>
			</div>
		),
	},
	{
		accessorKey: "requestedBy",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Requested By" />
		),
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
			<DataTableColumnHeader column={column} title="Date" />
		),
		cell: ({ row }) => {
			return new Date(row.getValue("createdAt")).toLocaleDateString();
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <ActionCell item={row.original} />,
	},
];
