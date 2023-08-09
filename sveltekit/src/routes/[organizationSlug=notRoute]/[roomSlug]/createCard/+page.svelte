<script lang="ts">
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import type { Organization } from '$lib/types/Organization';

	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import LinkEditor from '../../../../Components/Organisms/LinkEditor.svelte';
	import type { PageData } from './$types';
	import { UserStore, RoomStore } from '$lib/store';
	import type { Me } from '$lib/frontend/Classes/Me';
	export let data: PageData;
	export let organization: Organization = data.organization;
	export let me: Me;
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
