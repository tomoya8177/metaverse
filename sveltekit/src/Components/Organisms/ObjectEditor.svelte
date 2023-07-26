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
	import { EmptyObject } from '$lib/preset/EmptyObject';
	import { _ } from '$lib/i18n';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';

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
		FocusObjectStore.set(EmptyObject);
	};
</script>

{#if $FocusObjectStore.id}
	<li>
		<details role="list">
			<summary aria-haspopup="listbox" role="link">
				<div>
					<Icon icon="deployed_code" />
					<span style="max-width:15rem;text-wrap:nowrap;overflow:hidden;">
						{$FocusObjectStore.title}
					</span>
				</div>
			</summary>
			<ul role="listbox" style="min-width:20rem">
				{#if $FocusObjectStore.type.includes('video')}
					<li>
						<div style="display:flex;gap:0.4rem">
							<div>
								<button
									small
									class="circle-button"
									on:click={() => {
										const video = document.getElementById(`${$FocusObjectStore.id}asset`);
										video?.play();
									}}
								>
									<Icon icon="play_arrow" />
								</button>
							</div>
							<div>
								<button
									small
									class="circle-button"
									on:click={() => {
										const video = document.getElementById(`${$FocusObjectStore.id}asset`);
										video?.pause();
									}}
								>
									<Icon icon="pause" />
								</button>
							</div>
							<div>
								<button
									small
									class="circle-button"
									on:click={() => {
										const video = document.getElementById(`${$FocusObjectStore.id}asset`);
										if (!video) return console.error('video is null');
										video.currentTime = 0;
									}}
								>
									<Icon icon="replay" />
								</button>
							</div>
						</div>
					</li>
				{/if}

				{#if $FocusObjectStore.title != 'Shared Screen'}
					<li>
						<InputWithLabel
							label={_('Title')}
							bind:value={$FocusObjectStore.title}
							readonly={$FocusObjectStore.locked}
						/>
					</li>
					<li style="position:relative">
						<InputWithLabel
							label={_('Link To')}
							bind:value={$FocusObjectStore.linkTo}
							readonly={$FocusObjectStore.locked}
							copiable={$FocusObjectStore.linkTo}
						/>
					</li>
					{#if $FocusObjectStore.linkTo}
						<li>
							<a href={$FocusObjectStore.linkTo} target="_blank">
								<Icon icon="link" />
								{_('Go To Link')}
							</a>
						</li>
					{/if}
					{#if !$FocusObjectStore.locked}
						{#if $FocusObjectStore.type.includes('image') || $FocusObjectStore.type.includes('video')}
							{#if !$FocusObjectStore.isSphere}
								<button
									on:click={async () => {
										const updatedImage = await axios.put('/api/objects/' + $FocusObjectStore.id, {
											isSphere: true
										});
										$FocusObjectStore.remove();
										const object = new SharedObject(updatedImage.data);
										sharedObjects.remove($FocusObjectStore.id);
										sharedObjects.add(object);
										FocusObjectStore.set(object);
									}}>{_('Convert To 360 Sphere')}</button
								>
							{:else}
								<button
									on:click={async () => {
										const updatedImage = await axios.put('/api/objects/' + $FocusObjectStore.id, {
											isSphere: false
										});
										$FocusObjectStore.remove();
										const object = new SharedObject(updatedImage.data);
										sharedObjects.remove($FocusObjectStore.id);
										sharedObjects.add(object);
										FocusObjectStore.set(object);
									}}>{_('Convert To Flat Image')}</button
								>
							{/if}
						{/if}
						<li>
							<button
								on:click={async () => {
									await axios.put('/api/objects/' + $FocusObjectStore.id, {
										title: $FocusObjectStore.title,
										linkTo: $FocusObjectStore.linkTo
									});
									videoChat.sendMessage({
										key: 'objectUpdate',
										id: $FocusObjectStore.id,
										title: $FocusObjectStore.title,
										linkTo: $FocusObjectStore.linkTo
									});
								}}>{_('Update')}</button
							>
						</li>
					{/if}
				{/if}
				{#if !$FocusObjectStore.locked}
					<li>
						<button on:click={onDeleteClicked} class="secondary">{_('Delete')}</button>
					</li>
				{/if}
			</ul>
		</details>
	</li>
{/if}
