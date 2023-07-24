<script lang="ts">
	import EnterRoomDialog from '../../../Components/Organisms/EnterRoomDialog.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';

	import '$lib/AframeComponents';
	import { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import SceneUIs from '../../../Components/Organisms/SceneUIs.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { messageListeners, messageUnlisteners } from '$lib/frontend/messageListeners';
	import ProfileEditInputs from '../../../Components/Organisms/ProfileEditInputs.svelte';
	import AudioButton from '../../../Components/Organisms/AudioButton.svelte';
	import axios from 'axios';
	import type { Organization } from '$lib/types/Organization';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import { loadSharedObjects } from '$lib/frontend/loadSharedObjects';
	import { environmentPresets } from '$lib/preset/EnvironmentPresets';
	import { Unit } from '$lib/frontend/Classes/Unit';

	AFRAME.registerComponent('on-scene-loaded', {
		init: function () {
			this.el.addEventListener('loaded', () => {
				onSceneLoaded();
			});
		}
	});
	window.onpopstate = function (event) {
		console.log('onbeforeunload');
		// your code here
		delete AFRAME.components['on-scene-loaded'];
	};
	let sceneLoaded = false;
	let readyToConnect = false;
	let me: Me | null = null;
	const onSceneLoaded = async () => {
		me = new Me($UserStore.id);
		me.nickname = $UserStore.nickname;
		console.log({ me });
		Users.add(me);
		await me.setLastPosition($EventStore);
		if (!me.avatarURL) {
		}
		me.avatarURL =
			$UserStore.avatarURL || '/preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
		sceneLoaded = true;
		//me.twilioConnect($EventStore.id)

		//load mentor user
		if ($EventStore.mentor) {
			const mentor = await axios.get('/api/mentors/' + $EventStore.mentor).then((res) => res.data);

			mentor.userData = await axios.get('/api/users/' + mentor.user).then((res) => res.data);
			const mentorUnit = new Unit(mentor.userData.id);
			mentorUnit.nickname = mentor.userData.nickname;
			mentorUnit.avatarURL = mentor.userData.avatarURL;
			mentorUnit.el.setAttribute('ai-mentor', '');
			Users.add(mentorUnit);
			//mentorUser.setLastPosition($EventStore);
		}
	};

	let organization: Organization | null = null;
	onMount(async () => {
		organization = await axios
			.get('/api/organizations/' + $EventStore.organization)
			.then((res) => res.data);
	});
	onDestroy(() => {
		messageUnlisteners();
	});
</script>

{#if !readyToConnect}
	<EnterRoomDialog
		whenChatConnected={() => {
			loadSharedObjects($EventStore.id);
		}}
		{me}
		bind:readyToConnect
	/>
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
	{#if $EventStore.environmentPreset != 'none'}
		<a-entity
			environment="
        preset:{$EventStore.environmentPreset || 'default'};
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
	{#if $EventStore.environmentModelURL}
		<a-gltf-model src={$EventStore.environmentModelURL} position="0 0.01 0" />
	{/if}
	{#if $EventStore.navMeshModelURL}
		<a-gltf-model src={$EventStore.navMeshModelURL} position="0 0.01 0" visible="false" nav-mesh />
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
	<a-plane
		id="screenshare-container"
		width="8"
		height="6"
		position="0 4 -10"
		rotation="0 0 0"
		color="#7BC8A4"
		material="side: double;"
		name="Plane"
	/>
</a-scene>
{#if sceneLoaded}
	<SceneUIs {me} />
{/if}
