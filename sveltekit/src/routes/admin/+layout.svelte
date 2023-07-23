<script lang="ts">
	import { checkLogin } from '$lib/frontend/checkLogin';
	import { onMount } from 'svelte';
	import { UserStore } from '$lib/store';
	import Navigation from '../../Components/Organisms/Navigation.svelte';
	import Icon from '../../Components/Atom/Icon.svelte';
	import { _, lang } from '$lib/i18n';
	import type { PageData } from './$types';
	import Login from '../../Components/Organisms/Login.svelte';
	export let data: PageData;
	let loggedIn: boolean | null = data.loggedIn;
	if (!$UserStore.isAdmin) {
		//not allowed here
		//location.href = '/';
	}
</script>

{#if !loggedIn}
	<Login />
{:else}
	<Navigation title={`VirtuaIntel | ${_('Admin Console')}`} logoLinkTo={`/admin`} />
	{#if loggedIn}
		<div style="display:flex;margin-left:1rem;margin-right:1rem">
			<div class="menu">
				<aside>
					<nav>
						<ul>
							<li>
								<a href="/admin/users">
									<Icon icon="group" />
									{_('Users')}</a
								>
							</li>
							<li>
								<a href="/admin/organizations">
									<Icon icon="apartment" />
									{_('Organizations')}</a
								>
							</li>
							<li>
								<a href="/admin/rooms">
									<Icon icon="vrpano" />
									{_('Rooms')}</a
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
{/if}

<style>
	.menu {
		width: 10rem;
	}
	.content {
		flex: 1;
	}
</style>
