<script lang="ts">
	import MentorEdit from '../../../../Components/Organisms/MentorEdit.svelte';

	import AvatarThumbnail from '../../../../Components/Atom/AvatarThumbnail.svelte';

	import DocumentForAIRow from '../../../../Components/Molecules/DocumentForAIRow.svelte';

	import axios from 'axios';
	import { onMount } from 'svelte';
	import FilterPagination from '../../../../Components/Organisms/FilterPagination.svelte';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { page, updated } from '$app/stores';
	import { EmptyMentor } from '$lib/preset/EmptyMentor';
	import AvatarSelectPane from '../../../../Components/Organisms/AvatarSelectPane.svelte';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import Icon from '../../../../Components/Atom/Icon.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import type { Room } from '$lib/frontend/Classes/Room';
	import type { DocumentForAI } from '$lib/types/DocumentForAI';
	import { reinstallAIBrain } from '$lib/frontend/reinstallAIBrain';
	import type { PageData } from './$types';
	import { nl2br } from '$lib/math/nl2br';
	import { escapeHTML, unescapeHTML } from '$lib/math/escapeHTML';
	import { validateMentorData } from '$lib/frontend/validateMentorData';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { Mentor } from '$lib/frontend/Classes/Mentor';
	export let data: PageData;
	let paginated: Mentor[] = [];
	export let organization: Organization = data.organization;
	let mentors: Mentor[] = data.mentors.map((mentor) => new Mentor(mentor));

	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	let mentorsReady = false;
	export let users: User[] = data.users;
	let documents: DocumentForAI[] = [];

	onMount(async () => {
		const promises = mentors.map(async (mentor) => {
			await mentor.init();
			console.log({ mentor });
		});
		await Promise.all(promises);
		mentorsReady = true;
	});
	let busy: boolean = false;
	let newMentorModalOpen = false;
	let editMentor: Mentor = new Mentor({});
	let editMode: 'update' | 'create' = 'update';

	const onCreateClicked = async () => {
		if (!validateMentorData(editMentor)) return;
		busy = true;
		await editMentor.userData.create();
		editMentor.user = editMentor.userData.id;
		await editMentor.create();
		await editMentor.init();
		//createdMentor = setUpMentorbject(createdMentor);
		mentors = [...mentors, editMentor];
		//		editMentor.documents = await reinstallAIBrain(createdMentor);
		busy = false;
		newMentorModalOpen = false;
		actionHistory.send('createMentor', {
			mentor: editMentor.purifyData()
		});
	};
	const onUpdateClicked = async () => {
		if (!validateMentorData(editMentor)) return;
		if (!editMentor.userData?.id) return;
		busy = true;
		await editMentor.userData.update();
		await editMentor.update();
		await editMentor.init();
		editMentor.resetBrain();
		busy = false;
		newMentorModalOpen = false;
		actionHistory.send('updateMentor', { mentor: editMentor });
	};
	const onDeleteClicked = async () => {
		if (!confirm('Are you sure that you want to delete this mentor?')) return;
		await axios.delete('/api/mentors/' + editMentor.id).then((res) => res.data);
		editMentor.resetBrain();

		if (!editMentor.userData) return;
		await axios.delete('/api/users/' + editMentor.userData.id).then((res) => res.data);
		await axios.delete('/api/documentsForAI?mentor=' + editMentor.id).then((res) => res.data);
		newMentorModalOpen = false;
		mentors = mentors.filter((mentor) => mentor.id != editMentor.id);
		actionHistory.send('deleteMentor', { mentor: editMentor });
	};
</script>

<h2>{_('Mentors')}</h2>
<div style="width:10rem">
	<a
		href={'#'}
		role="button"
		on:click={async () => {
			const createdUser = await axios.post('/api/users', { nickname: '' }).then((res) => res.data);
			users = [...users, createdUser];
			let createdMentor = await axios
				.post('/api/mentors', {
					...editMentor,
					user: createdUser.id,
					organization: organization.id
				})
				.then((res) => res.data);
			createdMentor.userData = createdUser;
			editMentor = createdMentor;
			editMode = 'update';
			console.log({ editMentor });
			mentors = [...mentors, createdMentor];

			newMentorModalOpen = true;
		}}>{_('New Mentor')}</a
	>
</div>
{#if mentorsReady}
	<FilterPagination inputArray={mentors} bind:paginated />
	<table>
		<thead>
			<tr>
				<th>{_('Nickname')}</th>
				<th>{_('Introduction')}</th>
				<th>{_('Edit')}</th>
			</tr>
		</thead>
		<tbody>
			{#each paginated as mentor}
				<tr>
					<td>
						<a href={`/${organization.slug}/mentor/${mentor.id}`}>
							{#if mentor.userData?.avatarURL}
								<AvatarThumbnail url={mentor.userData.avatarURL} />
							{/if}
							{mentor.userData?.nickname || ''}
						</a>
					</td>
					<td>
						{@html nl2br(unescapeHTML(mentor.userData?.description) || '')}
					</td>
					<td>
						<button
							on:click={() => {
								editMentor = mentor;
								editMode = 'update';
								newMentorModalOpen = true;
							}}
						>
							{_('Edit')}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
{#if newMentorModalOpen && editMentor.userData}
	<dialog open>
		<article>
			<ModalCloseButton onClick={() => (newMentorModalOpen = false)} />

			<MentorEdit bind:editMentor />
			{#if editMentor.documents}
				<small> {_("VirtuaMentor's memory will be refreshed")} </small>
			{/if}
			{#if editMode == 'create'}
				<button
					aria-busy={busy}
					on:click={() => {
						onCreateClicked();
					}}>{_('Create')}</button
				>
			{:else}
				<button
					aria-busy={busy}
					on:click={() => {
						onUpdateClicked();
					}}>{_('Update')}</button
				>
				<button
					class="secondary"
					on:click={() => {
						onDeleteClicked();
					}}>{_('Delete')}</button
				>
			{/if}
		</article>
	</dialog>
{/if}
