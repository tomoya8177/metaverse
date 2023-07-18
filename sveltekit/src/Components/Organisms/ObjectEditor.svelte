<script lang="ts">
	import { FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Users } from '$lib/frontend/Classes/Users';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import { PUBLIC_FileStackPolicy, PUBLIC_FileStackSignature } from '$env/static/public';
	import { uploader } from '$lib/frontend/Classes/Uploader';

	const onDeleteClicked = async () => {
		if ($FocusObjectStore.title == 'Shared Screen') {
			//check if the screen belong to myself. otherwise you can't relete it.
			if (!$UserStore.onScreenShare) return alert('You are not sharing your screen.');
			videoChat.unpublishMyTrack('screen');
			const me = Users.find($UserStore.id);
			if (!me) return console.error('me is null');
			me?.hideScreen();
			$UserStore.onScreenShare = false;
			return;
		}

		const file = sharedObjects.get($FocusObjectStore.id);
		console.log({ file });
		await axios.delete('/api/objects/' + file.id);
		uploader.client.remove(file.handle, {
			policy: PUBLIC_FileStackPolicy,
			signature: PUBLIC_FileStackSignature
		});
		file.remove();
		videoChat.sendMessage({
			key: 'objectDelete',
			id: $FocusObjectStore.id
		});
		FocusObjectStore.set(null);
	};
</script>

{#if $FocusObjectStore}
	<li>
		<details role="list">
			<summary aria-haspopup="listbox" role="link">
				<div>
					<Icon icon="deployed_code" />
					{$FocusObjectStore.title}
					{#if $FocusObjectStore.locked}
						<Icon icon="lock" />
					{:else}
						<Icon icon="lock_open" />
					{/if}
				</div>
			</summary>
			<ul role="listbox">
				{#if $FocusObjectStore.user == $UserStore.id || $UserStore.isManager}
					<li>
						<div style="display:flex;flex-direction:reverse">
							<div style="flex:1">Locked</div>
							<div>
								<InputWithLabel type="switch" bind:value={$FocusObjectStore.locked} />
							</div>
						</div>
					</li>
				{/if}
				{#if $FocusObjectStore.title != 'Shared Screen'}
					<li style="position:relative">
						<div style="position:absolute; top:0px;right:1rem;">
							<a href={$FocusObjectStore.linkTo} target="_blank"> <Icon icon="open_in_new" /></a>
						</div>
						<InputWithLabel
							label="Link To"
							bind:value={$FocusObjectStore.linkTo}
							disabled={$FocusObjectStore.locked}
						/>
					</li>
					{#if !$FocusObjectStore.locked}
						<li>
							<button
								on:click={async () => {
									await axios.put('/api/objects/' + $FocusObjectStore.id, {
										linkTo: $FocusObjectStore.linkTo
									});
									videoChat.sendMessage({
										key: 'objectUpdate',
										id: $FocusObjectStore.id,
										linkTo: $FocusObjectStore.linkTo
									});
								}}>Update Link</button
							>
						</li>
					{/if}
				{/if}
				{#if !$FocusObjectStore.locked}
					<li>
						<button on:click={onDeleteClicked} class="secondary">Delete</button>
					</li>
				{/if}
			</ul>
		</details>
	</li>
{/if}
