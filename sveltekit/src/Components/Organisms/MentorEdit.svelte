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
	import { reinstallAIBrain } from '$lib/frontend/reinstallAIBrain';
	import { sendQuestionToAI } from '$lib/frontend/sendQuestionToAI';
	import { Message } from '$lib/frontend/Classes/Message';
	import { unescapeHTML } from '$lib/math/escapeHTML';
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	let documents: DocumentForAI[] = [];

	export let editMentor: Mentor = EmptyMentor;
	let introBusy = false;
</script>

{#if editMentor.userData}
	<InputWithLabel label={_('Nickname')} bind:value={editMentor.userData.nickname} />
	<AvatarSelectPane bind:url={editMentor.userData.avatarURL} />

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
	<InputWithLabel
		label={_('Introduction')}
		bind:value={editMentor.userData.description}
		type="textarea"
	/>
	<button
		aria-busy={introBusy}
		on:click={async () => {
			introBusy = true;
			await reinstallAIBrain(editMentor);
			const aiMessage = await sendQuestionToAI(
				editMentor.id,
				undefined,
				new Message({
					body: `Create your introduction in less than 100 words. Your new name is ${editMentor.userData?.nickname}. include your name, the context that you are given to help students. you are told to follow the instruction below. ${editMentor.prompt}`,
					user: editMentor.user
				})
			);
			console.log({ aiMessage });
			editMentor.userData.description = unescapeHTML(aiMessage.body);
			introBusy = false;
		}}
	>
		{_('Have AI to write the introduction')}
	</button>
{/if}