<script lang="ts">
	import { checkLogin } from '$lib/frontend/checkLogin';
	import { onMount, setContext } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';
	import Icon from '../../../Components/Atom/Icon.svelte';
	import { _, lang } from '$lib/i18n';
	import Navigation from '../../../Components/Organisms/Navigation.svelte';
	import axios from 'axios';
	import { page } from '$app/stores';
	import type { UserRole } from '$lib/types/UserRole';
	import type { Organization } from '$lib/types/Organization';
	import { organizationFromSlug } from '$lib/frontend/organizationFromSlug';
	import type { PageData } from './$types';
	import { Users } from '$lib/frontend/Classes/Users';
	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { EmptyObject } from '$lib/preset/EmptyObject';
	export let data: PageData;
	const organization: Organization = data.organization;
	const loggedIn: boolean = data.loggedIn;
	if (!organization) {
		alert(_('Organization not found'));
		location.href = '/';
	}
	if (!$UserStore.isMember) {
		alert(_('You are not a member of this organization'));
		location.href = '/';
	}
	if (!$UserStore.isManager) {
		alert(_('You are not a manager of this organization'));
		location.href = '/' + organization.slug;
	}
	onMount(async () => {
		console.log('manager dashboard mount');
		FocusObjectStore.set(EmptyObject);
		EventStore.set(EmptyEvent);
		Users.clear();
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
								<span>
									{_('Users')}
								</span>
							</a>
						</li>
						<li>
							<a href={`/${organization.slug}/manager/rooms`}>
								<Icon icon="vrpano" />
								<span>
									{_('Rooms')}
								</span>
							</a>
						</li>
						<li>
							<a href={`/${organization.slug}/manager/mentors`}>
								<Icon icon="person_book" />
								<span>
									{_('VirtuaMentors')}
								</span>
							</a>
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
		width: 14rem;
		margin-right: 1rem;
	}
	@media (max-width: 800px) {
		.menu {
			max-width: 4rem;
		}
		.menu span {
			font-size: small;
			display: block;
		}
		.menu a {
			text-align: center;
		}
	}
	.content {
		flex: 1;
		width: calc(100vw - 10rem);
	}
</style>
