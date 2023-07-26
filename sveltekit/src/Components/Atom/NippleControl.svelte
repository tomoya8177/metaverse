<script lang="ts">
	import { nippleControl } from '$lib/frontend/Classes/NippleControl';
	import { radian2degree } from '$lib/math/degree2radians';
	import { onMount } from 'svelte';
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
				button.style.left = `1rem`;
				button.style.top = `1rem`;
				nippleControl.distance = 0;
				nippleControl.direction = 0;
			});
			button?.addEventListener('touchmove', (e) => {
				if (nippleControl.status === 'dragging') {
					currentPos.x = e.touches[0].clientX;
					currentPos.y = e.touches[0].clientY;
					//move the button
					//distance is max 20px
					const distance = Math.min(
						20,
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
					button.style.left = `calc(${calculatedPos.x - initialPos.x}px + 1rem)`;
					button.style.top = `calc(${calculatedPos.y - initialPos.y}px + 1rem)`;

					nippleControl.distance = distance;
					nippleControl.direction = direction;
				}
			});
		}, 100);
	});
</script>

<div class="controlContainer">
	<div class="outerRing" />
	<div class="innerButton" />
</div>

<style>
	.controlContainer {
		position: relative;
	}
	.outerRing {
		position: absolute;
		height: 6rem;
		width: 6rem;
		border-radius: 3rem;
		background-color: aqua;
	}
	.innerButton {
		position: absolute;
		top: 1rem;
		left: 1rem;
		height: 4rem;
		width: 4rem;
		border-radius: 2rem;
		background-color: bisque;
	}
</style>
