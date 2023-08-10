<script lang="ts">
	import { onMount } from 'svelte';
	import { RoomStore, RigStore, UserStore, type xyz } from '$lib/store';
	import axios from 'axios';
	import { Unit } from '$lib/frontend/Classes/Unit';

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
	import { _ } from '$lib/i18n';
	import { speechInterval } from '$lib/frontend/aiSpeaksOut';
	import { appendObjectInTheRoom } from '$lib/frontend/appendObjectInTheRoom';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import type { Mentor } from '$lib/frontend/Classes/Mentor';

	export let message: Message;
	export let onDelete: (id: string) => void;
	export let forceNoPin = false;
	export let withPinWithTrash = true;
	onMount(async () => {
		//author = await axios.get('/api/users/' + message.user).then((res) => res.data);
		const interval = setInterval(() => {
			if (!message.isAIs) return;
			if (speechSynthesis.speaking) return;
			clearInterval(interval);
		}, 1000);
	});
	const sendToRoomClicked = async (message) => {
		const response = await axios.get(
			'https://www.filestackapi.com/api/file/' + message.handle + '/metadata'
		);
		console.log(response);
		actionHistory.send('sendFileFromChatToRoom', { file: { ...response.data, url: message.url } });
		appendObjectInTheRoom({
			roomId: $RoomStore.id,
			userId: $UserStore.id,
			me: Users.find($UserStore.id),
			file: { ...response.data, url: message.url }
		});
	};
	export let forceMentor: Mentor | null = null;
</script>

{#if message}
	{@const messageIsUsers = message.user == $UserStore.id}
	<div
		data-role="message"
		style="position:relative;display:flex;gap:0.1rem;margin-bottom:0.4rem;padding:0.4rem;border-radius:0.4rem;"
		style:background-color={messageIsUsers ? 'rgba(100,100,100,0.5)' : ''}
	>
		<div style="flex:1" style:text-align={messageIsUsers ? 'right' : 'left'}>
			{#if message.userData}
				<div style="font-size:0.9rem;">
					<a href={'#'}>
						{message.userData.nickname || ''}
					</a>
					{#if message.isAIs}
						<a
							transition:fade
							href={'#'}
							style="margin-left:0.2rem"
							title="Speaking"
							on:click={() => {
								speechSynthesis.cancel();
								clearInterval(speechInterval);

								//message.isTalking = false;
							}}
						>
							<Icon icon="campaign" />
						</a>
					{/if}
				</div>
			{/if}
			{#if message.type == 'attachment'}
				{@html message.body}
				<div>
					<a href={message.url} target="_blank">
						<img
							src={message.url}
							style="max-width:100%;max-height:10rem; border-radius:0.2rem"
							alt={message.body}
						/>
					</a>
				</div>
				{#if !forceMentor && message.handle}
					<a href={'#'} on:click={() => sendToRoomClicked(message)}>
						{_('Send to Room')}
					</a>
				{/if}
			{:else}
				{@html nl2br(message.body)}
			{/if}
			<div style="font-size:0.7rem;text-align:right;width:100%">
				{DateTime.fromISO(message.createdAt).setZone().toRelative()}
			</div>
		</div>
		{#if withPinWithTrash}
			{#if !forceNoPin}
				<a
					href={'#'}
					style:opacity={message.pinned ? 1 : 0.5}
					on:click={async () => {
						message = await axios
							.put('/api/messages/' + message.id, { pinned: !message.pinned })
							.then((res) => res.data);
						actionHistory.send('pinOrUnpinMessage', { ...message, body: escapeHTML(message.body) });
					}}
				>
					<Icon icon="push_pin" />
				</a>
			{/if}
			{#if message.user == $UserStore.id || message.user == 'Mentor'}
				<a
					href={'#'}
					on:click={async () => {
						await axios.delete('/api/messages/' + message.id);
						actionHistory.send('deleteMessage', { ...message, body: escapeHTML(message.body) });
						onDelete(message.id);
					}}
				>
					<Icon icon="delete" />
				</a>
			{/if}
		{/if}
	</div>
{/if}

<style>
</style>
