import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPostLoginHref } from "@/lib/post-login";

async function getRequestOrigin() {
	const h = await headers();

	// Prefer proxy headers (Vercel/Nginx/Traefik)
	const proto = h.get("x-forwarded-proto") ?? "http";
	const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3002";

	return `${proto}://${host}`;
}

export async function GET() {
	const href = await getPostLoginHref();
	const origin = await getRequestOrigin();

	// If href is already absolute, keep it; otherwise join to origin
	const url = href.startsWith("http")
		? href
		: new URL(href, origin).toString();

	return NextResponse.redirect(url, { status: 302 });
}
