<script lang="ts">
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import type { Organization } from '$lib/types/Organization';

	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import LinkEditor from '../../../../Components/Organisms/LinkEditor.svelte';
	import type { PageData } from './$types';
	import { UserStore, RoomStore } from '$lib/store';
	import { Me } from '$lib/frontend/Classes/Me';
	import { onMount } from 'svelte';
	import { Users } from '$lib/frontend/Classes/Users';
	import type { User } from '$lib/frontend/Classes/User';
	export let data: PageData;
	export let organization: Organization = data.organization;
</script>

<dialog open>
	<article style="max-width:calc(100vw - 2rem)">
		<a
			id="createCardModalCloseButton"
			href={`/${organization.slug}/${$RoomStore.slug}`}
			aria-label="Close"
			class="close"
		/>
		<LinkEditor
			{organization}
			onCreate={(sharedObject) => {
				sharedObject.attachElement();
				sharedObject.locked = false;
				sharedObjects.add(sharedObject);
				const me = Users.find($UserStore.id);
				if (me) {
					sharedObject.moveToMyFront(me.position, me.rotation);
				}
				document.getElementById('createCardModalCloseButton')?.click();
			}}
			onUpdate={(sharedObject) => {
				//sharedObject.moveToMyFront(me.position, me.rotation);
				document.getElementById('createCardModalCloseButton')?.click();
			}}
		/>
	</article>
</dialog>
