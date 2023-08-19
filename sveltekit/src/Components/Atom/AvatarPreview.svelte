<script lang="ts">
	import { onMount } from 'svelte';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
	import { THREE } from 'aframe';
	import { fade } from 'svelte/transition';
	import axios from 'axios';
	import type { User } from '$lib/frontend/Classes/User';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	export let user: User;
	let thumbnailURL = '';
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let backgroundColor = '#808080';
	let isLoading = true; // Add a new state variable to track loading state
	let id = 'preview' + Math.ceil(Math.random() * 1000).toString();
	onMount(async () => {
		// Load the placeholder image

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

		renderer.setClearColor(backgroundColor);
		const loader = new THREE.GLTFLoader();
		loader.load(user.avatarURL + '?quality=medium&useHands=false', (gltf: GLTF) => {
			gltf.scene.traverse((child: any) => {
				if (child.isMesh) {
					child.material.gammaFactor = 1;
				}
			});
			console.log({ gltf });
			scene.add(gltf.scene);

			isLoading = false;
		});

		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(-0.3, 1, 1).normalize();
		scene.add(light);

		const ambientLight = new THREE.AmbientLight(0xffffff, 1);
		scene.add(ambientLight);

		camera.position.z = 0.7;
		camera.position.y = 0.6;
		camera.position.x = 0.33;
		camera.rotation.y = Math.PI / 7;
		renderer.setSize(180, 180);
		const container = document.querySelector('#' + id);
		container?.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0.58, 0);

		function animate() {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
			controls.update();
		}

		animate();
		if (user.RPMId) {
			const json = await axios
				.get(`https://api.readyplayer.me/v1/avatars/${user.RPMId}.json`)
				.then((res) => res.data);
			console.log({ json });
			thumbnailURL = `https://api.readyplayer.me/v1/avatars/${user.RPMId}.png?uat=${json.uat}}`;
		} else {
			thumbnailURL =
				PresetAvatars.find((avatar) => avatar.url === user.avatarURL)?.thumbnailURL || '';
		}
	});
</script>

<div {id} class="placeholder">
	{#if isLoading}
		{#if thumbnailURL}
			<img src={thumbnailURL} alt="Loading..." />
		{:else}
			<div class="center" aria-busy="true" />
		{/if}
	{/if}
</div>

<style>
	.placeholder {
		position: relative;
		width: 180px;
		height: 180px;
		border-radius: 50%;
		overflow: hidden;
	}
	.center {
		position: absolute;
		left: 80px;
		top: 80px;
	}
	.placeholder *:not(.center) {
		position: absolute;
		top: 0px;
		left: 0px;
	}
	.placeholder img {
		position: absolute;
		top: 0px;
		left: 0px;
		min-width: 180px;
		width: 180px;
		height: 180px;
	}
</style>
