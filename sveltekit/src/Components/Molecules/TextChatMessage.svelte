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
	import { nl2br } from '$lib/frontend/nl2br';
	import type { Message } from '$lib/frontend/Classes/Message';
	import { DateTime } from 'luxon';
	import InputWithLabel from './InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { fade, slide } from 'svelte/transition';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import type { User } from '$lib/types/User';

	export let message: Message;
	export let onDelete: (id: string) => void;
	export let author: User | null;
	onMount(async () => {
		//author = await axios.get('/api/users/' + message.user).then((res) => res.data);
	});
</script>

{#if message}
	<div style="position:relative;display:flex;gap:0.1rem;margin-bottom:0.4rem">
		<div style="flex:1">
			{#if author}
				<div style="font-size:0.9rem;">
					<a>
						{author.nickname || ''}
					</a>
				</div>
			{/if}
			{@html nl2br(message.body)}
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
		{#if message.user == $UserStore.id}
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
