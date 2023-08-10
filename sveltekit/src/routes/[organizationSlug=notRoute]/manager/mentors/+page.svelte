<script lang="ts">
	import MentorEdit from '../../../../Components/Organisms/MentorEdit.svelte';

	import AvatarThumbnail from '../../../../Components/Atom/AvatarThumbnail.svelte';

	import DocumentForAIRow from '../../../../Components/Molecules/DocumentForAIRow.svelte';

	import axios from 'axios';
	import { onMount } from 'svelte';
	import FilterPagination from '../../../../Components/Organisms/FilterPagination.svelte';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { page, updated } from '$app/stores';
	import type { Mentor } from '$lib/types/Mentor';
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
	export let data: PageData;
	let paginated: Mentor[] = [];
	export let organization: Organization = data.organization;
	let mentors: Mentor[] = [];
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	export let users: User[] = data.users;
	let documents: DocumentForAI[] = [];
	const setUpMentorbject = (mentor: Mentor) => {
		const user = users.find((user) => user.id == mentor.user);
		const docs = documents.filter((document) => document.mentor == mentor.id);
		if (user) mentor.userData = user;
		if (document) mentor.documents = docs;
		return mentor;
	};
	onMount(async () => {
		mentors = await axios
			.get('/api/mentors?organization=' + organization.id)
			.then((res) => res.data);
		if (mentors.length) {
			users = await axios
				.get(`/api/users?id=in:'${mentors.map((mentor) => mentor.user).join("','")}'`)
				.then((res) => res.data);
			documents = await axios
				.get(`/api/documentsForAI?mentor=in:'${mentors.map((mentor) => mentor.id).join("','")}'`)
				.then((res) => res.data);
			mentors = mentors.map((mentor) => {
				return setUpMentorbject(mentor);
			});
			console.log({ mentors });
		}
	});
	let busy: boolean = false;
	let newMentorModalOpen = false;
	let editMentor: Mentor = EmptyMentor;
	let editMode: 'update' | 'create' = 'update';

	const onCreateClicked = async () => {
		if (!validateMentorData(editMentor)) return;
		busy = true;
		const createdUser = await axios.post('/api/users', editMentor.userData).then((res) => res.data);
		users = [...users, createdUser];
		let createdMentor = await axios
			.post('/api/mentors', { ...editMentor, user: createdUser.id, organization: organization.id })
			.then((res) => res.data);
		console.log({ createdMentor, createdUser });
		createdMentor = setUpMentorbject(createdMentor);
		mentors = [...mentors, createdMentor];
		await reinstallAIBrain(createdMentor);
		busy = false;
		newMentorModalOpen = false;
		actionHistory.send('createMentor', {
			mentor: { ...createdMentor, description: escapeHTML(createdMentor.description) }
		});
	};
	const onUpdateClicked = async () => {
		if (!validateMentorData(editMentor)) return;
		if (!editMentor.userData?.id) return;
		busy = true;
		const updatedUser = await axios
			.put('/api/users/' + editMentor.userData.id, {
				...editMentor.userData,
				description: escapeHTML(editMentor.userData.description)
			})
			.then((res) => res.data);
		console.log({ editMentor });
		users = users.map((user) => {
			if (user.id == updatedUser.id) {
				return updatedUser;
			}
			return user;
		});
		let updatedMentor = await axios
			.put('/api/mentors/' + editMentor.id, {
				prompt: escapeHTML(editMentor.prompt),
				...editMentor
			})
			.then((res) => res.data);
		console.log({ updatedMentor });
		mentors = mentors.map((mentor) => {
			if (mentor.id == updatedMentor.id) {
				updatedMentor = setUpMentorbject(updatedMentor);
				return updatedMentor;
			}
			return mentor;
		});
		await reinstallAIBrain(updatedMentor);
		busy = false;
		newMentorModalOpen = false;
		actionHistory.send('updateMentor', { mentor: updatedMentor });
	};
	const onDeleteClicked = async () => {
		if (!confirm('Are you sure that you want to delete this mentor?')) return;
		await axios.delete('/api/mentors/' + editMentor.id).then((res) => res.data);
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
{#if mentors.length}
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
								editMentor = { ...mentor };
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
