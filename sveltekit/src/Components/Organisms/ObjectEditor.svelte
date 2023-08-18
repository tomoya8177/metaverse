<script lang="ts">
	import { FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import Icon from '../Atom/Icon.svelte';
	import { _ } from '$lib/i18n';
	export let modalOpen = false;
</script>

{#if $FocusObjectStore}
	<div>
		<a
			href={'#'}
			on:click={() => {
				modalOpen = true;
			}}
		>
			<Icon icon="deployed_code" />
			<span style="max-width:15rem;text-wrap:nowrap;overflow:hidden;">
				{$FocusObjectStore.title}
			</span>
		</a>
	</div>
{/if}
