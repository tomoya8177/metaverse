<script lang="ts">
	import { checkLogin } from '$lib/frontend/checkLogin';
	import { onMount } from 'svelte';
	import { UserStore } from '$lib/store';
	import Navigation from '../../Components/Organisms/Navigation.svelte';
	import Icon from '../../Components/Atom/Icon.svelte';
	let loggedIn: boolean | null = null;
	onMount(async () => {
		loggedIn = await checkLogin();
		if (!$UserStore.isAdmin) {
			//not allowed here
			location.href = '/';
		}
	});
</script>

<Navigation title="Admin Console" />
{#if loggedIn}
	<div style="display:flex;margin-left:1rem;margin-right:1rem">
		<div class="menu">
			<aside>
				<nav>
					<ul>
						<li>
							<a href="/admin/users">
								<Icon icon="group" />
								Users</a
							>
						</li>
						<li>
							<a href="/admin/organizations">
								<Icon icon="apartment" />
								Organizations</a
							>
						</li>
						<li>
							<a href="/admin/events">
								<Icon icon="vrpano" />
								Events</a
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
