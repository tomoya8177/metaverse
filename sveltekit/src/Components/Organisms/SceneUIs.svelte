<script lang="ts">
	import ActionButtons from './ActionButtons.svelte';
	import ChatBox from './ChatBox.svelte';
	import { FocusObjectStore, UserStore } from '$lib/store';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { editableObject } from '$lib/Classes/EditableObject';
	import type { Me } from '$lib/Classes/Me';
	let textChatOpen = false;

	let rotation = 0;
	export let me: Me | null = null;
</script>

<div class="action-buttons">
	<ActionButtons bind:textChatOpen {me} />
</div>
{#if textChatOpen}
	<ChatBox />
{/if}

<div style:display={!$UserStore.onVideoMute && !textChatOpen ? 'block' : 'none'}>
	<div id="myCameraPreview" />
</div>

{#if $FocusObjectStore?.open}
	<div class="editingPane">
		<div style="display:flex">
			<div style="flex:1">
				{editableObject.name || ''}
			</div>
			<div>
				<a
					href={'#'}
					on:click={() => {
						$FocusObjectStore.open = false;
					}}
				>
					<Icon icon="close" />
				</a>
			</div>
		</div>
		<InputWithLabel
			label="Scale"
			value={editableObject.scaleX || 1}
			type="range"
			step={0.1}
			min={0.5}
			max={2}
			onChange={(e) => {
				editableObject.onScaleUpdated();
				editableObject.scaleX = 1;
			}}
			onInput={(e) => {
				const value = Number(e.target.value);
				editableObject.onScaleUpdate(value);
			}}
		/>

		<InputWithLabel
			label={`Rotation (${rotation})`}
			value={editableObject.x}
			type="range"
			step={5}
			min={-45}
			max={45}
			onChange={(e) => {
				editableObject.onRotationUpdated();
				editableObject.x = 0;
				rotation = 0;
			}}
			onInput={(e) => {
				const value = Number(e.target.value);
				editableObject.onRotationUpdate(value);
				rotation = value;
			}}
		/>
	</div>
{/if}

<style>
	#myCameraPreview {
		bottom: 6rem;
		right: 1rem;
		position: absolute;
		box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
		width: 8rem;
		height: 8rem;
		border-radius: 50%;
		overflow: hidden;
		align-self: center;
	}

	.action-buttons {
		position: absolute;
		bottom: 1rem;
		right: 0;
		display: flex;
		gap: 0.4rem;
	}

	.editingPane {
		padding: 0.4rem;
		border-radius: 0.4rem;
		position: absolute;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
	}
</style>
