<script lang="ts">
	import EnterRoomDialog from '../../../Components/Organisms/EnterRoomDialog.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import 'aframe-audio-analyser';
	import { onDestroy, onMount } from 'svelte';
	import { RoomStore, UserStore } from '$lib/store';

	import '$lib/AframeComponents';
	import { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import SceneUIs from '../../../Components/Organisms/SceneUIs.svelte';
	import { messageUnlisteners } from '$lib/frontend/messageListeners';
	import axios from 'axios';
	import type { Organization } from '$lib/types/Organization';
	import { loadSharedObjects } from '$lib/frontend/loadSharedObjects';
	import { Unit } from '$lib/frontend/Classes/Unit';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { myAlert, toast } from '$lib/frontend/toast';
	import ModalCloseButton from '../../../Components/Atom/ModalCloseButton.svelte';
	import { _ } from '$lib/i18n';
	import Icon from '../../../Components/Atom/Icon.svelte';
	import InputWithLabel from '../../../Components/Molecules/InputWithLabel.svelte';
	import { escapeHTML } from '$lib/math/escapeHTML';

	AFRAME.registerComponent('on-scene-loaded', {
		init: function () {
			this.el.addEventListener('loaded', () => {
				onSceneLoaded();
			});
		}
	});
	window.onpopstate = function (event) {
		delete AFRAME.components['on-scene-loaded'];
	};
	let sceneLoaded = false;
	let readyToConnect = false;
	let me: Me | null = null;
	const onSceneLoaded = async () => {
		actionHistory.send('enteringRoom');
		me = new Me($UserStore.id);
		me.nickname = $UserStore.nickname;
		Users.add(me);
		await me.setLastPosition($RoomStore);
		me.avatarURL =
			$UserStore.avatarURL || '/preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
		sceneLoaded = true;
		//me.twilioConnect($RoomStore.id)

		//load mentor user
		if ($RoomStore.mentor) {
			const mentor = await axios.get('/api/mentors/' + $RoomStore.mentor).then((res) => res.data);
			mentor.userData = await axios.get('/api/users/' + mentor.user).then((res) => res.data);
			const mentorUnit = new Unit(mentor.userData.id);
			mentorUnit.nickname = mentor.userData.nickname;
			mentorUnit.avatarURL = mentor.userData.avatarURL;
			mentorUnit.el.setAttribute('ai-mentor', '');
			mentorUnit.avatar?.setAttribute('move-mouth', 'userId:' + mentor.userData.id);
			Users.add(mentorUnit);
		}
	};

	onDestroy(() => {
		messageUnlisteners();
	});
	let QADialogOpen = false;
	let starValue = 5;
	let feedback = '';
</script>

{#if !readyToConnect}
	<EnterRoomDialog
		whenChatConnected={async () => {
			loadSharedObjects($RoomStore.id);
			const existingFeedback = await axios
				.get('/api/feedbacks?campaign=1&user=' + $UserStore.id)
				.then((res) => res.data);
			if (!existingFeedback.length) {
				setTimeout(() => {
					QADialogOpen = true;
				}, 120000); //in 2 minutes, the QA dialog will show up
			}
		}}
		{me}
		bind:readyToConnect
	/>
{/if}
{#if QADialogOpen}
	<dialog open>
		<article>
			<ModalCloseButton
				onClick={() => {
					QADialogOpen = false;
				}}
			/>
			<h3>
				{_('Rate This Metaverse!')}
			</h3>
			<section>
				<div style="display:flex">
					{#each [1, 2, 3, 4, 5] as i}
						<a
							href={'#'}
							on:click={() => {
								starValue = i;
							}}
							class="star"
							class:selected={starValue >= i}
						>
							<Icon size={4} icon="star" />
						</a>
					{/each}
				</div>
			</section>
			<InputWithLabel label={_('Give us your feedback')} type="textarea" bind:value={feedback} />
			<button
				on:click={async () => {
					const feedbackObj = {
						organization: $RoomStore.organization,
						room: $RoomStore.id,
						user: $UserStore.id,
						star: starValue,
						data: JSON.stringify({
							comment: escapeHTML(feedback)
						}),
						campaign: '1'
					};
					await axios.post('/api/feedbacks', feedbackObj);
					actionHistory.send('feedback', feedbackObj);
					QADialogOpen = false;
					toast(_('Thank you for your feedback!'));
				}}
			>
				{_('Send')}
			</button>
			<button
				class="secondary"
				on:click={() => {
					QADialogOpen = false;
					setTimeout(() => {
						QADialogOpen = true;
					}, 120000);
				}}
			>
				{_('Later')}
			</button>
		</article>
	</dialog>
{/if}
<a-scene
	on-scene-loaded
	renderer="colorManagement: true"
	id="scene"
	colorManagement="true"
	vr-mode-ui="enabled: false"
	ar-mode-ui="enabled: false"
	cursor="rayOrigin: mouse"
>
	<a-assets />
	<a-cursor raycaster="objects: .clickable" />
	<a-plane
		id="rayCatcher"
		width="20"
		height="20"
		position="0 -100 0"
		rotation="0 0 0"
		visible="false"
	/>
	{#if $RoomStore.environmentPreset != 'none'}
		<a-entity
			environment="
        preset:{$RoomStore.environmentPreset || 'default'};
        groundYScale:20
        "
		/>
	{:else}
		<a-entity
			environment="
				preset: default;
				ground:none
				"
		/>
	{/if}
	{#if $RoomStore.environmentModelURL}
		<a-gltf-model src={$RoomStore.environmentModelURL} position="0 0.01 0" />
	{/if}
	{#if $RoomStore.navMeshModelURL}
		<a-gltf-model src={$RoomStore.navMeshModelURL} position="0 0.01 0" visible="false" nav-mesh />
	{:else}
		<a-plane
			id="ground"
			shadow="receive: true"
			position="0 0 0"
			rotation="-90 0 0"
			width="20"
			height="20"
			nav-mesh
			visible="false"
		/>
	{/if}
</a-scene>
{#if sceneLoaded}
	<SceneUIs {me} />
{/if}

<style>
	.star {
		flex: 1;
		text-align: center;
		display: inline-block;
		color: gray;
	}
	.star.selected {
		color: orange;
	}
</style>
