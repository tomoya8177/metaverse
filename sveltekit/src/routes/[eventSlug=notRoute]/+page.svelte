<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onMount } from 'svelte';
	import { EventStore, RigStore, UserStore, type xyz } from '$lib/store';
	import axios from 'axios';
	import { Unit } from '$lib/Classes/Unit';

	import '$lib/AframeComponents';
	import { Me } from '$lib/Classes/Me';
	import { Users } from '$lib/Classes/Users';
	import SceneUIs from '../../Components/Organisms/SceneUIs.svelte';
	import { videoChat } from '$lib/Classes/VideoChat';

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
	let me: Me | null = null;
	const onSceneLoaded = async () => {
		me = new Me($UserStore.id);
		console.log({ me });
		Users.add(me);
		if ($UserStore.lastRoom === $EventStore.id && $UserStore.lastPosition) {
			const lastPosition = JSON.parse($UserStore.lastPosition);
			me.position = { ...lastPosition.position };
			me.rotation = { ...lastPosition.rotation };
			if (!me.avatarURL) {
				//no avatar set
			}
			me.avatarURL =
				$UserStore.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
			//not setting nickname for Me
			//io.emit('position', { position: lastPosition.position, rotation: lastPosition.rotation });
		}
		sceneLoaded = true;
		//me.twilioConnect($EventStore.id)
		videoChat.init($UserStore, $EventStore);
		await videoChat.connect();

		videoChat.listenTo('handshake', async (data) => {
			console.log('received handshake', data);
			const userUnit = await welcomeUnit(data.user.id);
			if (!userUnit) return;
			userUnit.position = data.position;
			userUnit.rotation = data.rotation;
		});
		videoChat.listenTo('position', async (data) => {
			let unit = Users.find(data.user.id);
			if (!unit) {
				console.log('position received, but no unit here');
				unit = await welcomeUnit(data.user.id);
			}
			if (!unit) return;
			unit.position = data.position;
			unit.rotation = data.rotation;
		});
		videoChat.listenTo('updateProfile', (data) => {
			const unit = Users.find(data.user.id);
			if (!unit) return;
			unit.nickname = data.nickname;
		});
	};
	const welcomeUnit = async (unitId: string) => {
		const unit = await axios.get('/api/users/' + unitId).then((res) => res.data);
		console.log({ unit });
		//let's check again before appending duplicate unit
		if (Users.find(unit.id)) return Users.find(unit.id);
		const userUnit = new Unit(unit.id);
		userUnit.nickname = unit.nickname;
		userUnit.avatarURL =
			unit.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
		Users.add(userUnit);
		return userUnit;
	};

	onMount(async () => {});
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
