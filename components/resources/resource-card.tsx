import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Home, Car, User } from "lucide-react";
import { ScheduleResource } from "./types";

interface ResourceCardProps {
	resource: ScheduleResource;
	typeCode: string; // ROOM or VEHICLE helps choose icon
	onEdit: (r: ScheduleResource) => void;
	onDelete: (r: ScheduleResource) => void;
}

export function ResourceCard({
	resource,
	typeCode,
	onEdit,
	onDelete,
}: ResourceCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">
					{resource.name}
				</CardTitle>
				{typeCode === "ROOM" ? (
					<Home className="h-4 w-4 text-muted-foreground" />
				) : typeCode === "VEHICLE" ? (
					<Car className="h-4 w-4 text-muted-foreground" />
				) : (
					<User className="h-4 w-4 text-muted-foreground" />
				)}
			</CardHeader>
			<CardContent>
				<p className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-10">
					{resource.resourceType.name}
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onEdit(resource)}
					>
						<Edit className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="text-destructive hover:text-destructive"
						onClick={() => onDelete(resource)}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
