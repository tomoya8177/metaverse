<script lang="ts">
	import RoomTitleForManagers from '../Molecules/RoomTitleForManagers.svelte';

	import { EmptyRoom } from '$lib/preset/EmptyRoom';
	import type { Room } from '$lib/frontend/Classes/Room';
	import axios from 'axios';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import FilterPagination from './FilterPagination.svelte';
	import { onMount } from 'svelte';
	import Icon from '../Atom/Icon.svelte';
	import { fade } from 'svelte/transition';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import type { UserRole } from '$lib/types/UserRole';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import type { Mentor } from '$lib/types/Mentor';
	import type { DocumentForAI } from '$lib/types/DocumentForAI';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import DocumentForAiRow from '../Molecules/DocumentForAIRow.svelte';
	import { reinstallAIBrain } from '$lib/frontend/reinstallAIBrain';
	import type { PageData } from '../../routes/[organizationSlug=notRoute]/manager/rooms/$types';
	import { environmentPresets } from '$lib/preset/EnvironmentPresets';
	import { EnvironmentModelPresets } from '$lib/preset/EnvironmentModelPresets';
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	let rooms: Room[] = [];
	export let mentors: Mentor[] = [];
	export let users: User[];
	let documents: DocumentForAI[] = [];

	export let editRoom: Room = EmptyRoom;
	let environmentPreset: string;
	const updateEnvironmentModel = (modelURL: string | undefined) => {
		if (typeof modelURL == 'undefined') return;
		const setup = EnvironmentModelPresets.find((p) => p.modelURL == modelURL);
		if (setup) {
			editRoom.navMeshModelURL = setup.navMeshURL;
		}
	};
	$: updateEnvironmentModel(editRoom.environmentModelURL);
</script>

<InputWithLabel label={_('Title')} bind:value={editRoom.title} />
<InputWithLabel label={_('Slug')} bind:value={editRoom.slug} />
{#if editRoom.withMetaverse}
	<InputWithLabel
		label={_('Environment Preset')}
		bind:value={editRoom.environmentPreset}
		selects={environmentPresets}
		type="select"
	/>
	<figure>
		<div style="display:flex;gap:0.4rem">
			{#each environmentPresets.filter((preset) => preset.value != 'none' && preset.value != 'moon') as preset}
				<div>
					<a
						href={'#'}
						on:click={() => {
							editRoom.environmentPreset = preset.value;
						}}
					>
						<img
							src={`/images/aframeenvironment_${preset.value}.jpg`}
							style="min-width:12rem;border-radius:0.4rem"
							alt=""
						/>
					</a>
				</div>
			{/each}
		</div>
	</figure>
	<InputWithLabel
		label={_('Environment Model')}
		type="select"
		selects={EnvironmentModelPresets.map((preset) => {
			return {
				name: preset.name,
				value: preset.modelURL
			};
		})}
		bind:value={editRoom.environmentModelURL}
	/>
{/if}

<InputWithLabel type="switch" label={_('Open for Anyone')} bind:value={editRoom.isPublic} />
{#if !editRoom.isPublic}
	<InputWithLabel
		type="switch"
		label={_('Open for Anyone in the organization')}
		bind:value={editRoom.isOpen}
	/>
	{#if !editRoom.isOpen}
		Allowed Users
		{#each users as user}
			<label>
				<input type="checkbox" bind:group={editRoom.allowedUsersArray} value={user.id} />
				{user.nickname}
				({user.email})
			</label>
		{/each}
	{/if}
{/if}
<InputWithLabel
	type="select"
	label={_('VirtuaMentor')}
	selects={[
		{
			name: _('None'),
			value: ''
		},
		...mentors.map((mentor) => {
			return {
				name: mentor?.userData?.nickname,
				value: mentor?.id
			};
		})
	]}
	bind:value={editRoom.mentor}
/>
{#if editRoom.mentor}
	<div>{_('Room Specific Materials')}</div>
	<small
		>{_(
			'In addition to the documents fed to the mentor, you can feed additional documents that will be used specifically in this room.'
		)}</small
	>
	{#each editRoom.documents || [] as document}
		<DocumentForAiRow
			{document}
			onDeleteDone={() => {
				editRoom.documents = editRoom.documents.filter((doc) => doc.id != document.id);
			}}
		/>
	{/each}
	<input
		type="file"
		accept=".pdf,.txt,.docx"
		multiple
		on:change={async (e) => {
			//get files from room
			const files = e.target.files;
			const res = await uploader.uploadLocally(files);
			const promises = res.data.map(async (file) => {
				const res = await axios.post('/api/documentsForAI', {
					filename: file.filename,
					title: file.title,
					type: file.type,
					room: editRoom.id
				});
				return res.data;
			});
			const fileDatas = await Promise.all(promises);
			editRoom.documents = [...editRoom.documents, ...fileDatas];
			e.target.value = '';
		}}
	/>
	{#if progress > 0}
		<progress max={100} value={progress} />
	{/if}
	<InputWithLabel
		meta={_(
			'In addition to the prompt given to the mentor, you can feed additional prompt specific to this room.'
		)}
		type="textarea"
		label={_('Prompt')}
		bind:value={editRoom.prompt}
	/>
	{#if editRoom.mentor}
		<small>
			{_("VirtuaMentor's memory will be refreshed")}
		</small>
	{/if}
{/if}
