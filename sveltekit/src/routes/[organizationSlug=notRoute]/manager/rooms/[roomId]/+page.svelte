<script lang="ts">
	import { Room } from '$lib/frontend/Classes/Room';
	import { myAlert, toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import axios from 'axios';
	import RoomEdit from '../../../../../Components/Organisms/RoomEdit.svelte';
	import type { PageData } from './$types';
	import { PUBLIC_XRCLOUD_API_KEY, PUBLIC_XRCLOUD_PROJECT_ID } from '$env/static/public';
	export let data: PageData;
	let room = new Room(data.room);
	const organization = data.organization;
	const mentors = data.mentors;
	const users = data.users;
	const onUpdateClicked = async () => {
		if (room.isXRCloud) {
			if (!room.title) {
				myAlert(_('Please enter title'));
				return;
			}
			const scene = await axios
				.get(`https://api.xrcloud.app/api/projects/${PUBLIC_XRCLOUD_PROJECT_ID}/scenes`, {
					headers: {
						Authorization: `Bearer ${PUBLIC_XRCLOUD_API_KEY}`
					}
				})
				.then((res) => res.data.items[0]);
			await axios.patch(
				`https://api.xrcloud.app/api/projects/${PUBLIC_XRCLOUD_PROJECT_ID}/scenes/${scene.id}/rooms/${room.xrCloudRoomId}`,
				{
					name: room.title
				},
				{
					headers: {
						Authorization: `Bearer ${PUBLIC_XRCLOUD_API_KEY}`
					}
				}
			);
		} else {
			if (!(await room.validate())) return;
		}
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

<RoomEdit bind:editRoom={room} {mentors} {users} forceXRCloudRoom={room.isXRCloud} />
<button aria-busy={updateBusy} on:click={onUpdateClicked}>{_('Update')}</button>
<button aria-busy={deleteBusy} class="secondary" on:click={onDeleteClicked}>{_('Delete')}</button>
