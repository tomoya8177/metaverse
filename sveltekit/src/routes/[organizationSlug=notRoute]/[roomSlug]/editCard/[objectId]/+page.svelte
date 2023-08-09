<script lang="ts">
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import type { Organization } from '$lib/types/Organization';

	import ModalCloseButton from '../../../../../Components/Atom/ModalCloseButton.svelte';
	import LinkEditor from '../../../../../Components/Organisms/LinkEditor.svelte';
	import type { PageData } from '../[objectId]/$types';
	import { UserStore, RoomStore } from '$lib/store';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { Event } from '$lib/frontend/Classes/Event';
	import type { Me } from '$lib/frontend/Classes/Me';
	export let data: PageData;
	export let organization: Organization = data.organization;
	export let editObject = new SharedObject(data.object);
	export let editEvent = data.event ? new Event(data.event) : undefined;
	export let me: Me;
	console.log({ editObject, editEvent });
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
			editMode="update"
			{editObject}
			{editEvent}
			{organization}
			attachEvent={!!editEvent}
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
