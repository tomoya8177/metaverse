<script lang="ts">
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import type { Organization } from '$lib/types/Organization';
	import { page } from '$app/stores';
	import ModalCloseButton from '../../../../../Components/Atom/ModalCloseButton.svelte';
	import LinkEditor from '../../../../../Components/Organisms/LinkEditor.svelte';
	import type { PageData } from '../[objectId]/$types';
	import { UserStore, RoomStore, FocusObjectStore } from '$lib/store';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { Event } from '$lib/frontend/Classes/Event';
	import type { Me } from '$lib/frontend/Classes/Me';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { goto } from '$app/navigation';
	export let data: PageData;
	export let organization: Organization = data.organization;
	export let editObject = sharedObjects.get($page.params.objectId);

	export let editEvent = data.event ? new Event(data.event) : undefined;
	if (typeof editObject == 'undefined') {
		//not in the room
		goto(`/${organization.slug}/${$RoomStore.slug}`);
	}
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
			canAttachCaption={true}
			editMode="update"
			bind:editObject
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
				if (!editObject) return;

				//sharedObject.moveToMyFront(me.position, me.rotation);
				document.getElementById('createCardModalCloseButton')?.click();
				console.log({ editObject });
				if (editObject.type.includes('image')) {
					// const existing = sharedObjects.get(sharedObject.id);
					// if (existing) {
					// 	editObject.el = existing.el;
					// 	editObject.asset = existing.asset;
					// 	editObject.captionAsset = existing.captionAsset;
					// }

					editObject.refreshPreview();
				}
				videoChat.sendMessage({
					key: 'objectUpdate',
					id: editObject.id,
					title: editObject.title,
					linkTo: editObject.linkTo,
					description: editObject.description,
					withCaption: editObject.withCaption,
					captionUrl: editObject.captionUrl,
					url: editObject.url
				});
			}}
			onDelete={(sharedObject) => {
				if (!editObject) return;
				editObject.remove();
				sharedObjects.remove(editObject.id);
				document.getElementById('createCardModalCloseButton')?.click();
				videoChat.sendMessage({
					key: 'objectDelete',
					id: editObject.id
				});
				FocusObjectStore.set(new SharedObject());
				toast(_('Deleted'));
			}}
		/>
	</article>
</dialog>
