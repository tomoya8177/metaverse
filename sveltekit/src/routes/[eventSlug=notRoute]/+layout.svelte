<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { EventStore, UserStore } from '$lib/store';
	import Login from '../../Components/Organisms/Login.svelte';
	import { fade } from 'svelte/transition';
	import { checkLogin } from '$lib/frontend/checkLogin';
	import Navigation from '../../Components/Organisms/Navigation.svelte';
	import { Event } from '$lib/frontend/Classes/Event';
	let loggedIn: boolean | null = null;
	let event: any = null;
	let noEvent = false;
	$: console.log(loggedIn);
	onMount(async () => {
		loggedIn = await checkLogin();
		console.log({ loggedIn });
		if (!loggedIn) return;
		const events = await axios
			.get(`/api/events?slug=${$page.params.eventSlug}`)
			.then((res) => res.data);
		console.log({ events });
		if (events.length) {
			EventStore.set(new Event(events[0]));
			console.log($EventStore);
		} else {
			noEvent = true;
		}
	});
</script>

{#if loggedIn === false}
	<Login />
{:else}
	{#if loggedIn === null}
		<dialog open transition:fade>
			<article>
				logging in...
				<progress />
			</article>
		</dialog>
	{/if}
	{#if $EventStore.id}
		<slot />
	{/if}
	{#if noEvent}
		<div style="display:flex;width:100vw;height:100vh">
			<div style="align-self:center;width:100%;text-align:center">
				NO EVENT FOUND
				<p>Please make sure you have the correct URL!</p>
			</div>
		</div>
	{/if}
	<div class="top">
		<Navigation />
	</div>
{/if}

<style>
	.top {
		position: fixed;
		top: 0;
		width: 100vw;
	}
</style>
