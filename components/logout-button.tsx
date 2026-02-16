"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
	iconOnly?: boolean;
	className?: string;
}

export function LogoutButton({
	iconOnly = false,
	className,
}: LogoutButtonProps) {
	const router = useRouter();

	const handleLogout = async () => {
		await authClient.signOut(); // Clear Better Auth session
		router.push("/auth/login"); // Redirect
		router.refresh(); // Revalidate App Router session
	};

	// if (iconOnly) {
	// 	return (
	// 		<Button
	// 			onClick={handleLogout}
	// 			variant="outline"
	// 			className={`flex items-center justify-center w-full
	//             p-3 rounded-md
	//             transition-all duration-300 ease-in-out
	//             hover:bg-muted ${className}`}
	// 		>
	// 			<LogOut
	// 				size={20}
	// 				className="transition-transform duration-300 group-hover:scale-110"
	// 			/>
	// 		</Button>
	// 	);
	// }

	return (
		<Button
			variant="outline"
			onClick={handleLogout}
			className={`flex items-center justify-center w-full p-3 rounded-md 
              transition-all duration-300 ease-in-out cursor-pointer
              hover:bg-muted ${className}`}
		>
			<LogOut className="h-4" />
			{iconOnly ? "" : "Logout"}
		</Button>
	);
}
