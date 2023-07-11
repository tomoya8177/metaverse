<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { onDestroy, onMount } from 'svelte';
	import { EventStore, FocusObjectStore, UserStore } from '$lib/store';

	import '$lib/AframeComponents';
	import { Me } from '$lib/Classes/Me';
	import { Users } from '$lib/Classes/Users';
	import SceneUIs from '../../Components/Organisms/SceneUIs.svelte';
	import { videoChat } from '$lib/Classes/VideoChat';
	import { messageListeners, messageUnlisteners } from '$lib/frontend/messageListeners';

	AFRAME.registerComponent('on-scene-loaded', {
		init: function () {
			this.el.addEventListener('loaded', () => {
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
		}
		if (!me.avatarURL) {
		}
		me.avatarURL =
			$UserStore.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
		sceneLoaded = true;
		//me.twilioConnect($EventStore.id)
		videoChat.init($UserStore, $EventStore);
		await videoChat.connect();
		messageListeners();
	};

	FocusObjectStore.subscribe((obj) => {
		if (!obj.open) return;
		setTimeout(() => {
			const editingPane = document.querySelector('.editingPane') as HTMLElement;
			if (!editingPane) return;
			editingPane.style.left = mousePos.x + 'px';
			editingPane.style.top = mousePos.y + 'px';
		}, 100);
	});
	let mousePos = { x: 0, y: 0 };
	const setMousePos = (e) => {
		mousePos = { x: e.clientX, y: e.clientY };
	};
	onMount(async () => {
		window.addEventListener('mouseup', setMousePos);
	});
	onDestroy(() => {
		window.removeEventListener('mouseup', setMousePos);
		messageUnlisteners();
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
		id="screenshare-container"
		class="clickable"
		editable-object
		width="8"
		height="6"
		position="0 4 -10"
		rotation="0 0 0"
		color="#7BC8A4"
		material="side: double;"
	/>
</a-scene>
{#if sceneLoaded}
	<SceneUIs {me} />
{/if}
