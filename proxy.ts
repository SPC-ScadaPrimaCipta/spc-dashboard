import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// List of public pages
const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

export default async function proxy(req: NextRequest, _ev: NextFetchEvent) {
	const { pathname } = req.nextUrl;

	// Public routes → allow access
	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
		return NextResponse.next();
	}

	// Get session from BetterAuth
	const session = await auth.api.getSession({
		headers: Object.fromEntries(req.headers.entries()),
	});

	// If user is NOT logged in → redirect to login
	if (!session) {
		const loginUrl = new URL("/auth/login", req.url);
		return NextResponse.redirect(loginUrl);
	}

	// Otherwise allow request
	return NextResponse.next();
}

// Configuration — apply to all routes except static files
export const config = {
	matcher: ["/((?!_next|api/upload|favicon.ico|assets).*)"],
};
