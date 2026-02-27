import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
	console.log("Seeding database...");

	// Create Superadmin Role
	const superAdminRole = await prisma.role.upsert({
		where: { name: "superadmin" },
		update: {},
		create: {
			name: "superadmin",
			description: "Super Administrator with full access",
		},
	});

	console.log("Superadmin role created:", superAdminRole.name);

	// Create User Role
	const userRole = await prisma.role.upsert({
		where: { name: "user" },
		update: {},
		create: {
			name: "user",
			description: "Basic user with limited access",
		},
	});

	console.log("User role created:", userRole.name);

	// Create basic permissions
	const permissions = [
		{ action: "manage", resource: "all", description: "Manage everything" },
		{ action: "read", resource: "users", description: "View users" },
		{ action: "manage", resource: "users", description: "Manage users" },
		{ action: "read", resource: "roles", description: "View roles" },
		{ action: "manage", resource: "roles", description: "Manage roles" },
		{
			action: "read",
			resource: "workflows",
			description: "View workflows",
		},
		{
			action: "manage",
			resource: "workflows",
			description: "Manage workflows",
		},
	];

	for (const perm of permissions) {
		await prisma.permission.upsert({
			where: {
				action_resource: {
					action: perm.action,
					resource: perm.resource,
				},
			},
			update: {},
			create: perm,
		});
	}

	console.log("Permissions seeded.");

	// Assign 'manage:all' to Superadmin
	const manageAllPerm = await prisma.permission.findUnique({
		where: {
			action_resource: {
				action: "manage",
				resource: "all",
			},
		},
	});

	if (manageAllPerm) {
		await prisma.role.update({
			where: { id: superAdminRole.id },
			data: {
				permissions: {
					connect: { id: manageAllPerm.id },
				},
			},
		});
		console.log("Assigned 'manage:all' to Superadmin.");
	}

	// Create Superadmin User
	const superAdminEmail = "superadmin@gmail.com";
	let superAdminUser = await prisma.user.findUnique({
		where: { email: superAdminEmail },
		include: { roles: true },
	});

	if (!superAdminUser) {
		console.log(`Creating superadmin user: ${superAdminEmail}`);

		// For better-auth, we can use the library's built in hashing or rely on the auth instance
		// Since we're in a script, we'll try to use the auth instance if possible, or create it directly.
		const { auth } = await import("../lib/auth");

		try {
			await auth.api.signUpEmail({
				body: {
					email: superAdminEmail,
					password: "1m4dm1n!",
					name: "Super Admin",
				},
				asResponse: false,
			});
			console.log(`Created user ${superAdminEmail} via better-auth.`);
		} catch (error) {
			console.error(
				"Failed to create user via better-auth signUpEmail:",
				error,
			);
		}

		// fetch the created user to assign roles
		superAdminUser = await prisma.user.findUnique({
			where: { email: superAdminEmail },
			include: { roles: true },
		});
	} else {
		console.log(`User ${superAdminEmail} already exists.`);
	}

	// Assign roles 'superadmin' and 'user' to the superadmin user natively
	if (superAdminUser) {
		const rolesToConnect = [{ id: superAdminRole.id }, { id: userRole.id }];

		await prisma.user.update({
			where: { id: superAdminUser.id },
			data: {
				role: "superadmin", // explicitly set scalar role for backward compatibility
				roles: {
					connect: rolesToConnect,
				},
			},
		});

		console.log(
			`Assigned superadmin and user roles to ${superAdminEmail}.`,
		);
	}

	// Seed Divisions
	const divisions = [
		{ code: "ICT", name: "ICT" },
		{ code: "AUTO", name: "Automation" },
		{ code: "BOD", name: "BOD" },
		{ code: "BDM", name: "Business Development & Marketing" },
		{ code: "FINANCE", name: "Finance & Administration" },
		{ code: "HRGA-HSE", name: "HRGA-HSE" },
		{ code: "MNR", name: "M&R" },
	];

	for (const div of divisions) {
		await prisma.division.upsert({
			where: { code: div.code },
			update: { name: div.name },
			create: div,
		});
	}
	console.log("Divisions seeded.");

	// Seed Resource Types
	const resourceTypes = [
		{ code: "PEOPLE", name: "People", sortOrder: 1 },
		{ code: "ROOM", name: "Room", sortOrder: 2 },
		{ code: "VEHICLE", name: "Vehicle", sortOrder: 3 },
	];

	for (const rt of resourceTypes) {
		await prisma.resourceType.upsert({
			where: { code: rt.code },
			update: { name: rt.name, sortOrder: rt.sortOrder },
			create: rt,
		});
	}
	console.log("Resource types seeded.");

	// Seed Task Statuses
	const taskStatuses = [
		{ code: "TODO", name: "To Do", sortOrder: 1 }, // Added TODO as reasonable default
		{ code: "IN_PROGRESS", name: "In Progress", sortOrder: 2 },
		{ code: "DONE", name: "Done", sortOrder: 3, isTerminal: true }, // Added DONE
	];

	for (const ts of taskStatuses) {
		await prisma.taskStatus.upsert({
			where: { code: ts.code },
			update: {
				name: ts.name,
				sortOrder: ts.sortOrder,
				isTerminal: ts.isTerminal,
			},
			create: ts,
		});
	}
	console.log("Task statuses seeded.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
