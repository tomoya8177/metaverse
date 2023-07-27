<script lang="ts">
	import DocumentForAIRow from '../Molecules/DocumentForAIRow.svelte';
	import axios from 'axios';
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { _ } from '$lib/i18n';
	import type { Mentor } from '$lib/types/Mentor';
	import { EmptyMentor } from '$lib/preset/EmptyMentor';
	import AvatarSelectPane from './AvatarSelectPane.svelte';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import type { DocumentForAI } from '$lib/types/DocumentForAI';
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	let documents: DocumentForAI[] = [];

	export let editMentor: Mentor = EmptyMentor;
</script>

{#if editMentor.userData}
	<InputWithLabel label={_('Nickname')} bind:value={editMentor.userData.nickname} />
	<AvatarSelectPane bind:url={editMentor.userData.avatarURL} />
	<InputWithLabel
		label={_('Introduction')}
		bind:value={editMentor.userData.description}
		type="textarea"
	/>
	<InputWithLabel label={_('Prompt')} bind:value={editMentor.prompt} type="textarea" />
	<div>{_('Brain Documents')}</div>
	{#each editMentor.documents || [] as document}
		<DocumentForAIRow
			{document}
			onDeleteDone={() => {
				editMentor.documents = editMentor.documents.filter((doc) => doc.id != document.id);
			}}
		/>
	{/each}
	<label for="file">{_('Choose Files')}</label>
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
					mentor: editMentor.id
				});
				return res.data;
			});
			const fileDatas = await Promise.all(promises);
			documents = [...documents, ...fileDatas];
			editMentor.documents = [...editMentor.documents, ...fileDatas];
			e.target.value = '';
		}}
	/>
	{#if progress > 0}
		<progress max={100} value={progress} />
	{/if}
{/if}
