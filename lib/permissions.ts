import {
	adminAc,
	defaultStatements,
	userAc,
} from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";

/**
 * The 'statement' object defines the resources and actions available in your application.
 * It is primarily used for Type Inference so TypeScript knows what "project" or "create" results in.
 *
 * Even for Dynamic RBAC, defining your core resources here helps with type safety.
 * You CAN pass an empty object {} as const, but you won't get autocompletion for permissions.
 */
const statement = {
	...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
	...adminAc.statements,
});

export const superadmin = ac.newRole({
	...adminAc.statements,
});

export const user = ac.newRole({
	...userAc.statements,
});
