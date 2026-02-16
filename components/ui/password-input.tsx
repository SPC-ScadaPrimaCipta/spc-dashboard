"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PasswordInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	({ className, ...props }, ref) => {
		const [isVisible, setIsVisible] = React.useState(false);

		return (
			<div className="relative">
				<Input
					type={isVisible ? "text" : "password"}
					className={cn("pr-9", className)}
					ref={ref}
					{...props}
				/>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setIsVisible(!isVisible)}
					className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent! hover:cursor-pointer"
					tabIndex={-1}
				>
					{isVisible ? (
						<EyeOff className="size-4" aria-hidden="true" />
					) : (
						<Eye className="size-4" aria-hidden="true" />
					)}
					<span className="sr-only">
						{isVisible ? "Hide password" : "Show password"}
					</span>
				</Button>
			</div>
		);
	}
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
