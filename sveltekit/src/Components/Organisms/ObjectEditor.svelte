<script lang="ts">
	import { FocusObjectStore, UserStore } from '$lib/store';
	import axios from 'axios';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import Icon from '../Atom/Icon.svelte';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { Users } from '$lib/frontend/Classes/Users';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import { PUBLIC_FileStackPolicy, PUBLIC_FileStackSignature } from '$env/static/public';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import { _ } from '$lib/i18n';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { toast } from '$lib/frontend/toast';
	import ObjectLockSelect from '../Molecules/ObjectLockSelect.svelte';
	import { getPositionFromLockedPosition } from '$lib/frontend/getPositionFromLockedPosition';

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
