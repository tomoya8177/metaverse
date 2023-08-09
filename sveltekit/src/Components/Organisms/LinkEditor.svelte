<script lang="ts">
	import { Event } from '$lib/frontend/Classes/Event';
	import { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { _ } from '$lib/i18n';
	import { RoomStore, UserStore } from '$lib/store';
	import type { Organization } from '$lib/types/Organization';
	import { onMount } from 'svelte';
	import EventEdit from '../../routes/[organizationSlug=notRoute]/manager/events/EventEdit.svelte';
	import CreateUpdateDeleteButtons from '../Molecules/CreateUpdateDeleteButtons.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import ScheduleEditor from '../Molecules/ScheduleEditor.svelte';
	import AttendanceEditor from '../../routes/[organizationSlug=notRoute]/manager/events/AttendanceEditor.svelte';
	import axios from 'axios';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Attendance } from '$lib/frontend/Classes/Attendance';
	import { DateTime } from 'luxon';
	import { PUBLIC_FileStackAPIKey } from '$env/static/public';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import { HTML2Canvas } from '$lib/frontend/Classes/HTML2Canvas';
	import { myAlert } from '$lib/frontend/toast';
	import LinkUrlDescriptionEditor from '../Molecules/LinkURLDescriptionEditor.svelte';
	import ObjectLockSelect from '../Molecules/ObjectLockSelect.svelte';
	import { ClockPositions } from '$lib/preset/ClockPositions';
	import { GenerateImage } from '$lib/frontend/Classes/GenerateImage';
	import { CardColors } from '$lib/preset/CardColors';
	export let editObject: SharedObject = new SharedObject();
	export let editMode: 'update' | 'create' = 'create';
	export let onCreate: (object: SharedObject) => void = (object) => {};
	export let onUpdate: (object: SharedObject) => void = (object) => {};
	export let onDelete: (object: SharedObject) => void = (object) => {};
	export let editEvent: Event = new Event();
	export let organization: Organization;
	export let attendances: Attendance[] = [];
	let users: User[] = [];
	onMount(async () => {
		const userRoles = await axios
			.get('/api/userRoles?organization=' + organization.id)
			.then((res) => res.data);
		users = await axios
			.get(`/api/users?id=in:'${userRoles.map((role) => role.user).join("','")}'`)
			.then((res) => res.data);
		console.log({ editObject, editEvent });
	});

	const putTogetherFile = async () => {
		if (!editObject.url) {
			const html2canvas = new HTML2Canvas();
			const blob = await html2canvas.getJpegBlob(
				document.querySelector('.previewLinkObject'),
				'image.jpg'
			);
			if (!blob) {
				myAlert('Error');
				return;
			}
			const file = await uploader.uploadBlob(blob, 'image.jpg');
			editObject.url = file.url;
			editObject.type = file.type;
			editObject.size = file.size;
			editObject.handle = file.url.split('/').pop();
		}
		editObject.user = $UserStore.id;
		editObject.room = $RoomStore.id;
	};

	const onCreateClicked = async () => {
		if (!editObject.validate()) return;
		busy = true;
		await putTogetherFile();

		await editObject.create();
		if (attachEvent) {
			editEvent.attachObject(editObject);
			editEvent.organization = organization.id;
			await editEvent.create();
		}
		busy = false;
		onCreate(editObject);
		// url to blob
	};

	const onUpdateClicked = async () => {
		if (!editObject.validate()) return;
		busy = true;
		await putTogetherFile();

		await editObject.update();
		if (attachEvent) {
			const existing = await axios.get('/api/events/' + editEvent.id).then((res) => res.data);
			console.log({ existing });

			editEvent.attachObject(editObject);
			editEvent.organization = organization.id;
			if (existing) {
				const updated = await editEvent.update();
				console.log({ updated });
			} else {
				await editEvent.create();
			}
		}
		busy = false;
		onUpdate(editObject);
	};
	const onDeleteClicked = () => {
		onDelete(editObject);
	};
	let textColor = '#ffffff';
	let backgroundColor = '#600060';
	export let attachEvent = false;
	let busy = false;
	let deleteBusy = false;
	let tempImageURL = '';
	let generateImageBusy = false;
</script>

<div class="flexOnWideScreen">
	<div style="min-width:14rem">
		<h4>
			{_('Object')}
		</h4>
		<InputWithLabel label={_('Title')} bind:value={editObject.title} />
		<LinkUrlDescriptionEditor bind:editItem={editObject} {organization} />
		<InputWithLabel
			label={_('Locked Position')}
			type="select"
			selects={ClockPositions}
			bind:value={editObject.lockedPosition}
		/>
		<InputWithLabel label={_('Attach Event')} bind:value={attachEvent} type="switch" />
	</div>
	{#if attachEvent && organization}
		<div>
			<h4>
				{_('Event')}
			</h4>
			<ScheduleEditor bind:editEvent />
			<AttendanceEditor bind:editEvent {users} bind:attendances />
		</div>
	{/if}
	<div style="max-width:20rem">
		<h4>
			{_('Graphics Preview')}
		</h4>

		{#if editObject.url}
			<button
				class="secondary"
				on:click={() => {
					editObject.url = '';
				}}
			>
				{_('Clear Graphic')}
			</button>
			<img src={editObject.url} style="width:20rem;" alt="" crossorigin="anonymous" />
		{:else}
			<button
				on:click={() => {
					uploader.launchPicker('image/*', 1, (result) => {
						tempImageURL = result.filesUploaded[0].url;
					});
				}}
			>
				{_('Upload Graphic')}
			</button>
			<button
				aria-busy={generateImageBusy}
				on:click={async () => {
					generateImageBusy = true;
					const prompt = `Icon for an event titled ${editObject.title} and discribed as below: ${editObject.description}.`;
					const generator = new GenerateImage(prompt);
					generator.onDone((file) => {
						generateImageBusy = false;
						console.log({ file });
						tempImageURL = file.url;
					});
					console.log({ generator });
				}}
			>
				{_('Generate Graphic with AI')}
			</button>
			{#if tempImageURL}
				<button
					class="secondary"
					on:click={() => {
						tempImageURL = '';
					}}
				>
					{_('Clear Graphic')}
				</button>
			{/if}
			<div class="previewLinkObject">
				{#if tempImageURL}
					<img src={tempImageURL} style="width:20rem;" alt="" crossorigin="anonymous" />
				{/if}
				<div
					style:background-color={backgroundColor || '#600060'}
					style="width:20rem;max-height:20rem;text-align:center;padding:1rem;overflow:hidden"
				>
					{#if editObject.iconURL}
						<img
							src={editObject.iconURL}
							style="width:3rem;margin-bottom:0.8rem;border-radius:0.4rem"
							alt=""
						/>
					{/if}
					<h2 style:color={textColor} style="margin-bottom:1rem">
						{editObject.title || _('Sample Title')}
					</h2>
					{#if attachEvent}
						<p style:color={textColor}>
							{DateTime.fromISO(editEvent.start).toLocaleString(
								editEvent.allDay ? DateTime.DATE : DateTime.DATETIME_FULL
							)}
						</p>
					{/if}
					{#if editObject.description}
						<p style:color={textColor} style="overflow:hidden">
							{editObject.description}
						</p>
					{/if}
				</div>
			</div>
			<small>
				{#if attachEvent}
					{_('Time will be displayed in local time of the user.')}<br />
				{/if}
				{_('"Click to open" message will be displayed after one click on the object.')}
			</small>
			<div>
				<strong>
					{_('Graphic Colors')}
				</strong>
				<div class="stylePicker">
					{#each CardColors as cardColor}
						<a
							href={'#'}
							style:color={cardColor.textColor}
							style:background-color={cardColor.backgroundColor}
							on:click={() => {
								textColor = cardColor.textColor;
								backgroundColor = cardColor.backgroundColor;
							}}
						>
							{cardColor.name}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
<CreateUpdateDeleteButtons
	{editMode}
	{onCreateClicked}
	{onUpdateClicked}
	{onDeleteClicked}
	{busy}
	{deleteBusy}
/>

<style>
	.stylePicker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 1rem;
	}
	.stylePicker > * {
		font-size: smaller;
		padding: 0.4rem;
		border-radius: 0.4rem;
	}
</style>
