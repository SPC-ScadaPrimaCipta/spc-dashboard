"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header"; // Assuming this exists based on file search
import { toast } from "sonner";

export type Proposal = {
	id: string;
	title: string;
	description: string | null;
	budget: number | null;
	status: string;
	userId: string;
	user?: {
		name: string | null;
		email: string;
		image: string | null;
	} | null;
	createdAt: string;
	updatedAt: string;
};

export const columns = (
	handleSubmit: (id: string) => void,
	handleDelete: (id: string) => void
): ColumnDef<Proposal>[] => [
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Title" />
		),
	},
	{
		accessorKey: "budget",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Budget" />
		),
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("budget") || "0");
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(amount);
			return (
				<div className="font-medium">{amount ? formatted : "-"}</div>
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
							? "default"
							: status === "REJECTED"
							? "destructive"
							: status === "PENDING_APPROVAL"
							? "secondary"
							: "outline"
					}
				>
					{status}
				</Badge>
			);
		},
	},
	{
		id: "author",
		header: "Author",
		cell: ({ row }) => {
			const user = row.original.user;
			return user ? user.name || user.email : row.original.userId;
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
		cell: ({ row }) => {
			const proposal = row.original;

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
								navigator.clipboard.writeText(proposal.id)
							}
						>
							Copy ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href={`/proposals/${proposal.id}`}>
								View Details
							</Link>
						</DropdownMenuItem>
						{proposal.status === "DRAFT" && (
							<>
								<DropdownMenuItem
									onClick={() => handleSubmit(proposal.id)}
								>
									Submit for Approval
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-red-600 focus:text-red-600"
									onClick={() => handleDelete(proposal.id)}
								>
									Delete
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
