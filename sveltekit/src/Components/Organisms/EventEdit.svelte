<script lang="ts">
	import RoomTitleForManagers from '../Molecules/RoomTitleForManagers.svelte';

	import { EmptyEvent } from '$lib/preset/EmptyEvent';
	import { Event } from '$lib/frontend/Classes/Event';
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
	let events: Event[] = [];
	export let mentors: Mentor[] = [];
	export let users: User[];
	let documents: DocumentForAI[] = [];

	export let editEvent: Event = EmptyEvent;
	let environmentPreset: string;
	const updateEnvironmentModel = (modelURL: string | undefined) => {
		if (typeof modelURL == 'undefined') return;
		const setup = EnvironmentModelPresets.find((p) => p.modelURL == modelURL);
		if (setup) {
			editEvent.navMeshModelURL = setup.navMeshURL;
		}
	};
	$: updateEnvironmentModel(editEvent.environmentModelURL);
</script>

<InputWithLabel label={_('Title')} bind:value={editEvent.title} />
<InputWithLabel label={_('Slug')} bind:value={editEvent.slug} />
<InputWithLabel label={_('With Metaverse')} type="switch" bind:value={editEvent.withMetaverse} />
{#if editEvent.withMetaverse}
	<InputWithLabel
		label={_('Environment Preset')}
		bind:value={editEvent.environmentPreset}
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
							editEvent.environmentPreset = preset.value;
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
		bind:value={editEvent.environmentModelURL}
	/>
{/if}

<InputWithLabel type="switch" label={_('Allow Audio')} bind:value={editEvent.allowAudio} />
<InputWithLabel type="switch" label={_('Allow Video')} bind:value={editEvent.allowVideo} />
<InputWithLabel type="switch" label={_('Open for Anyone')} bind:value={editEvent.isPublic} />
{#if !editEvent.isPublic}
	<InputWithLabel
		type="switch"
		label={_('Open for Anyone in the organization')}
		bind:value={editEvent.isOpen}
	/>
	{#if !editEvent.isOpen}
		Allowed Users
		{#each users as user}
			<label>
				<input type="checkbox" bind:group={editEvent.allowedUsersArray} value={user.id} />
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
	bind:value={editEvent.mentor}
/>
{#if editEvent.mentor}
	<div>{_('Room Specific Materials')}</div>
	{#each editEvent.documents || [] as document}
		<DocumentForAiRow
			{document}
			onDeleteDone={() => {
				editEvent.documents = editEvent.documents.filter((doc) => doc.id != document.id);
			}}
		/>
	{/each}
	<input
		type="file"
		accept=".pdf,.txt,.docx"
		multiple
		on:change={async (e) => {
			//get files from event
			const files = e.target.files;
			const res = await uploader.uploadLocally(files);
			const promises = res.data.map(async (file) => {
				const res = await axios.post('/api/documentsForAI', {
					filename: file.filename,
					title: file.title,
					type: file.type,
					event: editEvent.id
				});
				return res.data;
			});
			const fileDatas = await Promise.all(promises);
			editEvent.documents = [...editEvent.documents, ...fileDatas];
			e.target.value = '';
		}}
	/>
	{#if progress > 0}
		<progress max={100} value={progress} />
	{/if}
	<InputWithLabel type="textarea" label={_('Prompt')} bind:value={editEvent.prompt} />
	{#if editEvent.mentor}
		<small>
			{_("VirtuaMentor's memory will be refreshed")}
		</small>
	{/if}
{/if}
