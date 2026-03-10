import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";
import prisma from "../lib/prisma";

async function main() {
	console.log("Seeding employees...");

	const csvPath = path.join(process.cwd(), "prisma", "employee_data.csv");
	const csvContent = fs.readFileSync(csvPath, "utf-8");
	const lines = csvContent
		.split("\n")
		.map((l: string) => l.trim())
		.filter((l: string) => l.length > 0);

	// Skip header line
	const dataLines = lines.slice(1);

	const divisions = await prisma.division.findMany();

	// Retrieve PEOPLE resource type
	const peopleType = await prisma.resourceType.findUnique({
		where: { code: "PEOPLE" },
	});

	if (!peopleType) {
		console.warn(
			"PEOPLE resource type not found. Make sure seed.ts is run first.",
		);
	}

	const { auth } = await import("../lib/auth");

	const COLORS = [
		{ name: "Blue", value: "#3b82f6" },
		{ name: "Red", value: "#ef4444" },
		{ name: "Green", value: "#22c55e" },
		{ name: "Yellow", value: "#eab308" },
		{ name: "Purple", value: "#a855f7" },
		{ name: "Pink", value: "#ec4899" },
		{ name: "Orange", value: "#f97316" },
		{ name: "Gray", value: "#6b7280" },
	];

	let sortOrder = 1;

	for (const line of dataLines) {
		const columns = line.split(",");
		if (columns.length < 6) continue;

		const employeeNo = columns[0].trim();
		const fullName = columns[1].trim();
		const orgCode = columns[2].trim();
		const position = columns[3].trim();
		const initials = columns[4].trim();
		const email = columns[5].trim();

		console.log(`Processing employee ${email}...`);

		// Check if user exists
		let user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			try {
				await auth.api.signUpEmail({
					body: {
						email: email,
						password: "1234567890",
						name: fullName,
					},
					asResponse: false,
				});
				console.log(`Created user ${email} via better-auth.`);
			} catch (error) {
				console.error(
					`Failed to create user ${email} via better-auth:`,
					error,
				);
				continue;
			}

			user = await prisma.user.findUnique({
				where: { email },
			});
		} else {
			console.log(`User ${email} already exists.`);
		}

		if (user) {
			const division = divisions.find(
				(d: { code: string | null; id: string }) => d.code === orgCode,
			);

			await prisma.userProfile.upsert({
				where: { userId: user.id },
				update: {
					divisionId: division?.id,
					position: position,
					employeeNo: employeeNo,
					initials: initials,
					sortOrder: sortOrder,
				},
				create: {
					userId: user.id,
					divisionId: division?.id,
					position: position,
					employeeNo: employeeNo,
					initials: initials,
					sortOrder: sortOrder,
				},
			});
			console.log(`Updated profile for ${email}.`);

			if (peopleType) {
				const randomColor =
					COLORS[Math.floor(Math.random() * COLORS.length)].value;
				const resourceCode =
					initials || employeeNo || `EMP${sortOrder}`;

				const existingResource =
					await prisma.scheduleResource.findFirst({
						where: { userId: user.id },
					});

				if (existingResource) {
					await prisma.scheduleResource.update({
						where: { id: existingResource.id },
						data: {
							name: fullName,
							code: resourceCode,
							color: randomColor,
						},
					});
				} else {
					await prisma.scheduleResource.create({
						data: {
							resourceTypeId: peopleType.id,
							userId: user.id,
							name: fullName,
							code: resourceCode,
							color: randomColor,
							isActive: true,
						},
					});
				}
				console.log(`Updated ScheduleResource for ${email}.`);
			}
		}

		sortOrder++;
	}

	console.log("Employee seeding completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
