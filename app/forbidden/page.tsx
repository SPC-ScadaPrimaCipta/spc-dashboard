import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
	return (
		<div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
			<div className="flex flex-col items-center gap-2 text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
					<ShieldAlert className="h-10 w-10 text-destructive" />
				</div>
				<h1 className="text-4xl font-bold tracking-tight">403</h1>
				<h2 className="text-2xl font-semibold">Access Forbidden</h2>
				<p className="max-w-[500px] text-muted-foreground">
					You do not have permission to access this resource. Please
					contact your administrator if you believe this is an error.
				</p>
			</div>
			<div className="flex gap-4">
				<Button asChild variant="default">
					<Link href="/dashboard">Return to Dashboard</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/auth/login">Login with different account</Link>
				</Button>
			</div>
		</div>
	);
}
