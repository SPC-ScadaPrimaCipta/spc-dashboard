import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ScheduleResource } from "./types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTable } from "@/components/datatable/data-table";

interface PeopleTableProps {
	data: ScheduleResource[];
	onEdit: (r: ScheduleResource) => void;
	onDelete: (r: ScheduleResource) => void;
}

export function PeopleTable({ data, onEdit, onDelete }: PeopleTableProps) {
	const columns = useMemo<ColumnDef<ScheduleResource>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
			},
			{
				accessorKey: "resourceType.name",
				header: "Type",
			},
			{
				id: "actions",
				header: () => <div className="text-right">Actions</div>,
				cell: ({ row }) => {
					const resource = row.original;
					return (
						<div className="flex items-center justify-end gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onEdit(resource)}
							>
								<Edit className="h-4 w-4 text-muted-foreground" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onDelete(resource)}
							>
								<Trash2 className="h-4 w-4 text-destructive" />
							</Button>
						</div>
					);
				},
			},
		],
		[onEdit, onDelete],
	);

	return <DataTable columns={columns} data={data} filterKey="name" />;
}
