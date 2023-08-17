<script lang="ts">
	import { Room } from '$lib/frontend/Classes/Room';
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import RoomEdit from '../../../../../Components/Organisms/RoomEdit.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	let room = new Room(data.room);
	const organization = data.organization;
	const mentors = data.mentors;
	const users = data.users;
	const onUpdateClicked = async () => {
		if (!(await room.validate())) return;
		updateBusy = true;
		await room.update();
		//room = new Room({ ...room, documents: room.documents });
		updateBusy = false;
		toast(_('Updated'));
	};
	const onDeleteClicked = async () => {
		if (!confirm(_('Are you sure to delete this room?'))) return;
		deleteBusy = true;
		await room.delete();
		deleteBusy = false;
		location.href = '/' + organization.slug + '/manager/rooms';
	};
	let updateBusy = false;
	let deleteBusy = false;
</script>

<RoomEdit bind:editRoom={room} {mentors} {users} />
<button aria-busy={updateBusy} on:click={onUpdateClicked}>{_('Update')}</button>
<button aria-busy={deleteBusy} class="secondary" on:click={onDeleteClicked}>{_('Delete')}</button>
