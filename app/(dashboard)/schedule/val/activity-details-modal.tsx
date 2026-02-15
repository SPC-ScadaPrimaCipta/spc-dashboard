"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface ActivityDetailsModalProps {
	isVisible: boolean;
	onClose: () => void;
	activity: any;
	onEdit: () => void;
}

export function ActivityDetailsModal({
	isVisible,
	onClose,
	activity,
	onEdit,
}: ActivityDetailsModalProps) {
	if (!activity) return null;

	return (
		<Dialog open={isVisible} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Activity Details</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<h3 className="font-semibold text-sm text-gray-500">
							Title
						</h3>
						<p>{activity.title}</p>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<h3 className="font-semibold text-sm text-gray-500">
								Start Date
							</h3>
							<p>{activity.formattedStartDate}</p>
						</div>
						<div>
							<h3 className="font-semibold text-sm text-gray-500">
								End Date
							</h3>
							<p>{activity.formattedEndDate}</p>
						</div>
					</div>
					<div>
						<h3 className="font-semibold text-sm text-gray-500">
							Description
						</h3>
						<p className="text-sm text-gray-700">
							{activity.description || "No description"}
						</p>
					</div>
					{/* Add more fields as needed based on the task object */}
				</div>
			</DialogContent>
		</Dialog>
	);
}
