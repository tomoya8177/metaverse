<script lang="ts">
	import SceneUIs from './SceneUIs.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { EventStore, RigStore, UserStore, type xyz } from '$lib/store';
	import axios from 'axios';
	import { Unit } from '$lib/Classes/Unit';

	import '$lib/AframeComponents';
	import { Me } from '$lib/Classes/Me';
	import { Users } from '$lib/Classes/Users';

	AFRAME.registerComponent('on-scene-loaded', {
		init: function () {
			console.log('scene loaded');
			this.el.addEventListener('loaded', () => {
				console.log('scene loaded');
				//this.el.sceneEl?.enterVR();
				onSceneLoaded();
			});
		}
	});
	let sceneLoaded = false;
	const onSceneLoaded = () => {
		const me = new Me($UserStore.id);
		Users.add(me);
		if ($UserStore.lastRoom === $EventStore.id && $UserStore.lastPosition) {
			const lastPosition = JSON.parse($UserStore.lastPosition);
			me.position = { ...lastPosition.position };
			me.rotation = { ...lastPosition.rotation };
			me.avatarURL =
				$UserStore.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
			//not setting nickname for Me
			io.emit('position', { position: lastPosition.position, rotation: lastPosition.rotation });
		}
		sceneLoaded = true;
		//me.twilioConnect($EventStore.id)
	};

	onMount(async () => {
		io.emit('userId', $UserStore.id); // Send the message
		io.emit('enterRoom', $EventStore.id); // Send the message
	});
	io.on('userLeftRoom', (data) => {
		if (data.from == $UserStore.id) return;
		//user left
		console.log('userLeftRoom', data);
		const unit = Users.find(data.from);
		unit?.leave();
		Users.remove(data.from);
		let container = document.getElementById('media-container' + data.from);
		console.log(container);
		container?.remove();
	});
	io.on('updateProfile', (profile: { nickname: string }) => {
		const unit = Users.find($UserStore.id);
		if (!unit) return;
		unit.nickname = profile.nickname;
	});
	io.on('userInRoom', async (data) => {
		if (data.from == $UserStore.id) return;
		//new uer joined
		io.emit('position', { position: $RigStore.position, rotation: $RigStore.rotation });
		//user el not created yer
		const user = await axios.get('/api/users/' + data.from).then((res) => res.data);
		if (document.getElementById(data.from)) return;
		const userUnit = new Unit(user.id);
		userUnit.nickname = user.nickname;
		userUnit.avatarURL =
			user.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
		console.log('user in room', userUnit);
		Users.add(userUnit);
	});
	io.on('position', (data: { from: string; position: { position: xyz; rotation: xyz } }) => {
		if (data.from == $UserStore.id) return;
		const user = Users.find(data.from);
		if (!user) return;
		user.position = data.position.position;
		user.rotation = data.position.rotation;
	});
</script>

<a-scene
	on-scene-loaded
	renderer="colorManagement: true"
	id="scene"
	colorManagement="true"
	vr-mode-ui="enabled: false"
	ar-mode-ui="enabled: false"
	cursor="rayOrigin: mouse"
	raycaster="objects: .clickable"
>
	<a-assets />
	<a-entity
		environment="
        preset:forest;
        ground:canyon;
        groundYScale:20
        "
	/>
	<a-plane
		id="ground"
		shadow="receive: true"
		position="0 0 0"
		rotation="-90 0 0"
		width="20"
		height="20"
		nav-mesh
		visible="false"
		color="#7BC8A4"
	/>
	<a-plane
		id="screenchare-container"
		width="8"
		height="6"
		position="0 4 -10"
		rotation="0 0 0"
		color="#7BC8A4"
		material="side: double;"
	/>
</a-scene>
{#if sceneLoaded}
	<SceneUIs />
{/if}
