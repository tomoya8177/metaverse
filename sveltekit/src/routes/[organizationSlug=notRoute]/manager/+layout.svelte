<script lang="ts">
	import { checkLogin } from '$lib/frontend/checkLogin';
	import { onMount, setContext } from 'svelte';
	import { UserStore } from '$lib/store';
	import Icon from '../../../Components/Atom/Icon.svelte';
	import { _, lang } from '$lib/i18n';
	import Navigation from '../../../Components/Organisms/Navigation.svelte';
	import axios from 'axios';
	import { page } from '$app/stores';
	import type { UserRole } from '$lib/types/UserRole';
	import type { Organization } from '$lib/types/Organization';
	import { organizationFromSlug } from '$lib/frontend/organizationFromSlug';
	let organization: Organization | null = null;
	let loggedIn: boolean | null = null;
	onMount(async () => {
		loggedIn = await checkLogin();
		console.log({ loggedIn });
		organization = await organizationFromSlug($page.params.organizationSlug);

		if (!organization) {
			alert(_('Organization not found'));
			location.href = '/';
			return;
		}
		const userRole: UserRole = await axios
			.get('/api/userRoles?user=' + $UserStore.id + '&organization=' + organization.id)
			.then((res) => res.data[0]);
		if (!userRole) {
			alert(_('You are not a member of this organization'));
			location.href = '/';
			return;
		}

		if (userRole.role != 'manager') {
			alert(_('You are not a manager of this organization'));
			//not allowed here
			location.href = '/' + organization.slug;
			return;
		}
		console.log(loggedIn, organization, userRole);
	});
</script>

{#if loggedIn && organization}
	<div style="display:flex;margin-left:1rem;margin-right:1rem">
		<div class="menu">
			<aside>
				<nav>
					<ul>
						<li>
							<a href={`/${organization.slug}/manager/users`}>
								<Icon icon="group" />
								{_('Users')}</a
							>
						</li>

						<li>
							<a href={`/${organization.slug}/manager/events`}>
								<Icon icon="vrpano" />
								{_('Events')}</a
							>
						</li>
						<li>
							<a href={`/${organization.slug}/manager/mentors`}>
								<Icon icon="person_book" />
								{_('Mentors')}</a
							>
						</li>
					</ul>
				</nav>
			</aside>
		</div>
		<div class="content">
			<slot />
		</div>
	</div>
{/if}

<style>
	.menu {
		width: 10rem;
	}
	.content {
		flex: 1;
	}
</style>
