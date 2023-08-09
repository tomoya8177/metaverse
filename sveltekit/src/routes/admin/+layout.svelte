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
		// not allowed here
		location.href = '/';
	}
</script>

<svelte:head>
	<title>
		{_('Admin Console')} | VirtuaCampus
	</title>
</svelte:head>

{#if !loggedIn}
	<Login />
{:else}
	<Navigation title={`${_('Admin Console')}`} logoLinkTo={`/admin`} />
	{#if loggedIn}
		<div style="display:flex;margin-left:1rem;margin-right:1rem">
			<div class="menu">
				<aside>
					<nav>
						<ul>
							<li>
								<a href="/admin/users">
									<Icon icon="group" />
									<span>
										{_('Users')}
									</span>
								</a>
							</li>
							<li>
								<a href="/admin/organizations">
									<Icon icon="apartment" />
									<span>
										{_('Organizations')}
									</span>
								</a>
							</li>
							<li>
								<a href="/admin/rooms">
									<Icon icon="vrpano" />
									<span>
										{_('Rooms')}
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
{/if}

<style>
	.menu {
		width: 10rem;
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
	}
</style>
