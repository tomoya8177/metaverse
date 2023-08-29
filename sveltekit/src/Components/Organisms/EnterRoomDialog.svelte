<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { RoomStore, UserStore } from '$lib/store';
	import { DateTime } from 'luxon';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import SceneUIs from './SceneUIs.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { messageListeners, messageUnlisteners } from '$lib/frontend/messageListeners';
	import ProfileEditInputs from './ProfileEditInputs.svelte';
	import AudioButton from '../Atom/AudioButton.svelte';
	import axios from 'axios';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import NameTag from '../Atom/NameTag.svelte';
	import AvatarPreview from '../Atom/AvatarPreview.svelte';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { fade } from 'svelte/transition';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import { escapeHTML } from 'mymetaverse-helper';
	import type { Room } from '$lib/frontend/Classes/Room';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import { toast } from '$lib/frontend/toast';
	import { Message } from '$lib/frontend/Classes/Message';
	import { textChat } from '$lib/frontend/Classes/TextChat';
	export let room: Room;

	export let organization: Organization;
	onMount(async () => {
		if (!$UserStore.nicknameURL) {
			profileDialogOpen = true;
		}
	});
	const onLeaveClicked = () => {
		actionHistory.send('leaveRoom');
		videoChat.leave();
		textChat.leave();
		RoomStore.set(null);
		if ($UserStore?.isMember) {
			location.href = '/' + organization?.slug;
		} else {
			location.href = '/';
		}
	};
	let profileDialogOpen = false;
	let busy = false;
</script>

<dialog open>
	<article>
		{#if room}
			<div>{_('Room Title')}</div>
			<h4>{room.title}</h4>
			<div>{_('Organization')}</div>
			<h5>{organization.title}</h5>
			<NameTag user={$UserStore} size={24} border={false} />
			<div style="text-align:center">
				<div style="display:inline-block">
					{#key $UserStore.avatarURL}
						<AvatarPreview bind:RPMId={$UserStore.RPMId} bind:url={$UserStore.avatarURL} />
					{/key}
				</div>
			</div>
			<button
				on:click={() => {
					profileDialogOpen = true;
				}}
			>
				{_('Edit Profile')}
			</button>

			<button
				aria-busy={busy}
				on:click={async () => {
					busy = true;
					await room.enter($UserStore);
					const result = await room.connect();
					busy = false;
					$UserStore.unit?.updateAvatar();

					if (result) {
						actionHistory.send('enterRoom');
					}
				}}
			>
				{_('Enter')}
			</button>
			<button class="secondary" on:click={onLeaveClicked}>{_('Leave')}</button>
		{/if}
	</article>
</dialog>
{#if profileDialogOpen}
	<dialog open transition:fade>
		<article>
			<ModalCloseButton
				onClick={() => {
					profileDialogOpen = false;
				}}
			/>
			<h3>Change Profile</h3>

			<ProfileEditInputs
				withName
				withDescription
				onUpdateDone={() => {
					actionHistory.send('profileUpdate', {
						user: { ...$UserStore, description: escapeHTML($UserStore.description) }
					});
					profileDialogOpen = false;
				}}
			/>
		</article>
	</dialog>
{/if}
