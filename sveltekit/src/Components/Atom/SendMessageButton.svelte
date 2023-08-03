<script lang="ts">
	import { _ } from '$lib/i18n';
	import Icon from './Icon.svelte';
	export let onMessageSendClicked: () => void;
	export let busy: boolean;
	export let newMessageGenerateImage: boolean = false;
</script>

<button aria-busy={busy} style="margin-bottom:0.2rem" on:click={onMessageSendClicked}>
	{#if !newMessageGenerateImage}
		<Icon icon="send" />
		{_('Send')}
	{:else}
		<Icon icon="palette" />
		{_('Generate Image')}
	{/if}
</button>
