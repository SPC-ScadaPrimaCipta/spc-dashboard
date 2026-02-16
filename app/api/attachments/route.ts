import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
	ensureFolderPathOnSiteDrive,
	uploadFileToSiteDrive,
} from "@/lib/sharepoint/sharepoint";

export const runtime = "nodejs";

function mapModuleFolder(refType: string) {
	// Mapping refType to folder names in SharePoint
	const map: Record<string, string> = {
		proposal_project: "Proposal Project",
		Contracts: "Contracts",
		APP: "APP",
		DailyReport: "Daily Report",
		GoodsRequest: "GoodsRequest",
		HSSE: "HSSE",
	};
	return map[refType] ?? refType;
}

export async function POST(req: NextRequest) {
	try {
		const h = await headers();
		const session = await auth.api.getSession({
			headers: h,
		});

		const userId = session?.user?.id;

		if (!userId) {
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);
		}

		// Retrieve the user's Microsoft account to get the access token
		const account = await prisma.account.findFirst({
			where: {
				userId: userId,
				providerId: "microsoft",
			},
		});

		const accessToken = account?.accessToken;

		if (!accessToken) {
			return NextResponse.json(
				{
					error: "Microsoft account not linked or access token missing",
				},
				{ status: 401 }
			);
		}

		const form = await req.formData();
		const file = form.get("file") as File | null;
		const refType = String(form.get("refType") ?? "");
		const refId = String(form.get("refId") ?? "");

		if (!file || !refType || !refId) {
			return NextResponse.json(
				{ error: "file, refType, refId required" },
				{ status: 400 }
			);
		}

		const siteId = process.env.SHAREPOINT_SITE_ID;
		if (!siteId) throw new Error("Missing SHAREPOINT_SITE_ID env var");

		const moduleFolder = mapModuleFolder(refType);
		// Folder path construction: Documents/<Module>/<RefId>
		const folderPath = `Documents/${moduleFolder}/${refId}`;

		// Ensure the folder structure exists on SharePoint
		await ensureFolderPathOnSiteDrive({
			siteId,
			accessToken,
			folderPath,
		});

		// Upload the file to SharePoint
		const uploaded = await uploadFileToSiteDrive({
			siteId,
			accessToken,
			folderPath,
			file,
		});

		// Create the attachment record in the database
		const created = await prisma.attachment.create({
			data: {
				name: uploaded.name,
				url: uploaded.webUrl,
				type: file.type || "application/octet-stream",
				size: uploaded.size,
				refType,
				refId,
				uploadedBy: userId,
				spDriveId: uploaded.id,
			},
		});

		return NextResponse.json({ attachment: created });
	} catch (e: any) {
		console.error("Upload failed:", e);
		return NextResponse.json(
			{ error: e?.message ?? "Upload failed" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const refType = searchParams.get("refType");
	const refId = searchParams.get("refId");

	if (!refType || !refId) {
		return NextResponse.json(
			{ error: "Missing refType or refId" },
			{ status: 400 }
		);
	}

	try {
		const attachments = await prisma.attachment.findMany({
			where: {
				refType,
				refId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(attachments);
	} catch (error) {
		console.error("Error fetching attachments:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
