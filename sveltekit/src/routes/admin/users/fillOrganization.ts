import type { User } from '$lib/frontend/Classes/User';
import type { Organization } from '$lib/types/Organization';
import type { UserRole } from '$lib/types/UserRole';

export const fillOrganization = (
	user: User,
	userRoles: UserRole[],
	organizations: Organization[]
) => {
	const filteredUserRoles: UserRole[] = userRoles.filter((userRole) => userRole.user == user.id);
	if (!filteredUserRoles.length) return user;
	user.userRoles = filteredUserRoles;
	user.organizations = organizations.filter((org) =>
		filteredUserRoles.find((userRole) => userRole.organization == org.id)
	);
	return user;
};
