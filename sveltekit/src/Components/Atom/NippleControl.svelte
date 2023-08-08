<script lang="ts">
	import { nippleControl } from '$lib/frontend/Classes/NippleControl';
	import { radian2degree } from '$lib/math/degree2radians';
	import { onMount } from 'svelte';
	export let size = 2;
	let dragging = false;
	let initialPos = { x: 0, y: 0 };
	let currentPos = { x: 0, y: 0 };
	onMount(() => {
		setTimeout(() => {
			const button = document.querySelector('.innerButton');
			button?.addEventListener('touchstart', (e) => {
				nippleControl.status = 'dragging';
				//mark initial position
				initialPos.x = e.touches[0].clientX;
				initialPos.y = e.touches[0].clientY;
			});
			button?.addEventListener('touchend', (e) => {
				nippleControl.status = 'idle';
				//move button to original position
				button.style.left = `${size / 2}rem`;
				button.style.top = `${size / 2}rem`;
				nippleControl.distance = 0;
				nippleControl.direction = 0;
				nippleControl.distanceX = 0;
				nippleControl.distanceY = 0;
			});
			button?.addEventListener('touchmove', (e) => {
				if (nippleControl.status === 'dragging') {
					currentPos.x = e.touches[0].clientX;
					currentPos.y = e.touches[0].clientY;
					//move the button
					//distance is max 20px
					const distance = Math.min(
						30,
						Math.sqrt(
							Math.pow(currentPos.x - initialPos.x, 2) + Math.pow(currentPos.y - initialPos.y, 2)
						)
					);

					const direction = Math.atan2(currentPos.y - initialPos.y, currentPos.x - initialPos.x);
					//get calculated position which is the point from initial pos that is away by distance value in direction
					const calculatedPos = {
						x: initialPos.x + distance * Math.cos(direction),
						y: initialPos.y + distance * Math.sin(direction)
					};
					button.style.left = `calc(${calculatedPos.x - initialPos.x}px + ${size / 2}rem)`;
					button.style.top = `calc(${calculatedPos.y - initialPos.y}px + ${size / 2}rem)`;

					nippleControl.distance = distance;
					nippleControl.direction = direction;
					//get distanceX and distance Y
					const distanceX = currentPos.x - initialPos.x;
					const distanceY = currentPos.y - initialPos.y;
					nippleControl.distanceX = distanceX;
					nippleControl.distanceY = distanceY;
				}
			});
		}, 100);
	});
</script>

<div class="controlContainer">
	<div
		class="outerRing"
		style={`position: absolute;
		height: ${size * 3}rem;
		width: ${size * 3}rem;
		border-radius: ${size * 3}rem;
		border: 1px solid rgba(122,122,122,1);`}
	/>
	<div
		class="innerButton"
		style={`position: absolute;
	top: ${size / 2}rem;
	left: ${size / 2}rem;
	height: ${size * 2}rem;
	width: ${size * 2}rem;
	border-radius: ${size}rem;
	background-color: rgba(255,255,255,0.5);`}
	/>
</div>

<style>
	.controlContainer {
		position: relative;
	}
</style>
