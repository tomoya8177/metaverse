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
	import { Message } from '$lib/frontend/Classes/Message';
	import { unescapeHTML } from '$lib/math/escapeHTML';
	import FulllNameInput from '../Atom/FulllNameInput.svelte';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { onMount } from 'svelte';
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	let documents: DocumentForAI[] = [];
	let voices: SpeechSynthesisVoice[] = [];
	onMount(async () => {
		const synth = window.speechSynthesis;
		synth.addEventListener('voiceschanged', () => {
			voices = synth.getVoices();
			console.log(voices);
		});
	});

	export let editMentor: Mentor = EmptyMentor;
	let introBusy = false;
</script>

{#if editMentor.userData}
	<div style="display:flex;gap:0.4rem">
		<FulllNameInput user={editMentor.userData} />
	</div>
	<InputWithLabel
		meta={_('Only alphabets and numbers allowed for nickname')}
		label={_('Nickname')}
		bind:value={editMentor.userData.nickname}
	/>
	<AvatarSelectPane
		bind:url={editMentor.userData.avatarURL}
		thumbnailURL={PresetAvatars.find((preset) => preset.url == editMentor.userData.avatarURL)
			?.thumbnailURL || ''}
	/>

	<InputWithLabel
		meta={_(
			'Specify the language you want it to speak. If not specified, AI mentor will talk in English.'
		)}
		label={_('Prompt')}
		bind:value={editMentor.prompt}
		type="textarea"
	/>
	<div>{_('Brain Documents')}</div>
	<small>
		{_(
			"Feed documents to the mentor's brain. The AI will answer questions based on these documents."
		)}
	</small>
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
			const response = await axios.post('/mentor', {
				messages: [
					{
						role: 'system',
						content: `Create your introduction in less than 100 words. Your name is ${editMentor.userData?.firstName} ${editMentor.userData?.lastName}. Include your name, the context that you are given to help students. you are told to follow the instruction below. ${editMentor.prompt}`
					}
				]
			});

			editMentor.userData.description = unescapeHTML(await response.data.response.content);
			introBusy = false;
		}}
	>
		{_('Have AI to write the introduction')}
	</button>
	<InputWithLabel
		label={_('AI Voice')}
		bind:value={editMentor.voiceURI}
		type="select"
		selects={voices
			.sort((a, b) => (a.lang > b.lang ? 1 : -1)) //sort by language
			.map((voice) => ({
				value: voice.voiceURI,
				name: `${voice.name} (${voice.lang})`
			}))}
		onChange={() => {
			const utterance = new SpeechSynthesisUtterance(editMentor.userData.description);
			utterance.voice =
				voices.find((voice) => voice.voiceURI == editMentor.voiceURI) ||
				voices.find((voice) => voice.default) ||
				voices[0];
			speechSynthesis.speak(utterance);
		}}
	/>
{/if}
