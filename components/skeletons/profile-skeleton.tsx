import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileSkeleton() {
	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-64" />
				</div>
			</header>

			{/* Profile Information Skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40 mb-2" />
					<Skeleton className="h-4 w-60" />
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-32" />
				</CardContent>
			</Card>

			{/* Password Section Skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40 mb-2" />
					<Skeleton className="h-4 w-60" />
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-40" />
				</CardContent>
			</Card>
		</div>
	);
}
