<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onMount } from 'svelte';
	import { EventStore, RigStore, UserStore, type xyz } from '$lib/store';
	import axios from 'axios';
	import { Unit } from '$lib/frontend/Classes/Unit';

	import '$lib/AframeComponents';
	import { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import { VideoChat } from '$lib/frontend/Classes/VideoChat';
	import { nl2br } from '$lib/math/nl2br';
	import type { Message } from '$lib/frontend/Classes/Message';
	import { DateTime } from 'luxon';
	import InputWithLabel from './InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { fade, slide } from 'svelte/transition';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import type { User } from '$lib/frontend/Classes/User';

	export let message: Message;
	export let onDelete: (id: string) => void;
	export let author: User | null;
	onMount(async () => {
		//author = await axios.get('/api/users/' + message.user).then((res) => res.data);
		const interval = setInterval(() => {
			if (!message.isTalking) return;
			if (speechSynthesis.speaking) return;
			message.isTalking = false;
			clearInterval(interval);
		}, 1000);
	});
</script>

{#if message}
	<div style="position:relative;display:flex;gap:0.1rem;margin-bottom:0.4rem">
		<div style="flex:1">
			{#if author}
				<div style="font-size:0.9rem;">
					<a href={'#'}>
						{author.nickname || ''}
					</a>
					{#if message.isTalking}
						<a
							transition:fade
							href={'#'}
							style="margin-left:0.2rem"
							title="Speaking"
							on:click={() => {
								speechSynthesis.cancel();
								message.isTalking = false;
							}}
						>
							<Icon icon="campaign" />
						</a>
					{/if}
				</div>
			{/if}
			{#if message.type == 'attachment'}
				<a href={message.url} target="_blank">
					{message.body}
				</a>
			{:else}
				{@html nl2br(message.body)}
			{/if}
			<div style="font-size:0.7rem;text-align:right;width:100%">
				{DateTime.fromISO(message.createdAt).setZone().toRelative()}
			</div>
		</div>

		<a
			href={'#'}
			style:opacity={message.pinned ? 1 : 0.5}
			on:click={async () => {
				message = await axios
					.put('/api/messages/' + message.id, { pinned: !message.pinned })
					.then((res) => res.data);
			}}
		>
			<Icon icon="push_pin" />
		</a>
		{#if message.user == $UserStore.id || message.user == 'Mentor'}
			<a
				href={'#'}
				on:click={async () => {
					await axios.delete('/api/messages/' + message.id);
					onDelete(message.id);
				}}
			>
				<Icon icon="delete" />
			</a>
		{/if}
	</div>
{/if}

<style>
</style>
