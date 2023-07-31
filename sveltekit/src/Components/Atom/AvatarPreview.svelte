<script lang="ts">
	import { onMount } from 'svelte';
	// import { Scene } from 'three/src/scenes/Scene.js';
	// import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
	// import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
	export let url: string;

	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;

	onMount(() => {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
		renderer = new THREE.WebGLRenderer({ antialias: true });

		renderer.setClearColor(0x808080);
		const loader = new THREE.GLTFLoader();
		loader.load(url, (gltf: GLTF) => {
			gltf.scene.traverse((child: any) => {
				if (child.isMesh) {
					child.material.gammaFactor = 1;
				}
			});
			console.log({ gltf });
			scene.add(gltf.scene);
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
		const container = document.querySelector('#avatarPreview');
		container?.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0.58, 0);

		function animate() {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
			controls.update();
		}

		animate();
	});
</script>

<div id="avatarPreview" />

<style>
	#avatarPreview {
		width: 180px;
		height: 180px;
		border-radius: 1rem;
		overflow: hidden;
	}
</style>
