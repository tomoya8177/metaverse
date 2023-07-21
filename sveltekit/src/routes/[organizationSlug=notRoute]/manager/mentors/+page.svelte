<script lang="ts">
	import DocumentForAIRow from '../../../../Components/Molecules/DocumentForAIRow.svelte';

	import axios from 'axios';
	import { onMount } from 'svelte';
	import FilterPagination from '../../../../Components/Organisms/FilterPagination.svelte';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import type { Mentor } from '$lib/types/Mentor';
	import { EmptyMentor } from '$lib/preset/EmptyMentor';
	import AvatarSelectPane from '../../../../Components/Organisms/AvatarSelectPane.svelte';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import Icon from '../../../../Components/Atom/Icon.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import type { Event } from '$lib/frontend/Classes/Event';

	let paginated: Mentor[] = [];
	let organization: Organization;
	let mentors: Mentor[] = [];
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});
	onMount(async () => {
		organization = await axios
			.get('/api/organizations?slug=' + $page.params.organizationSlug)
			.then((res) => res.data[0]);
		mentors = await axios
			.get('/api/mentors?organization=' + organization.id)
			.then((res) => res.data);
		if (mentors.length) {
			const users = await axios
				.get(`/api/users?id=in:'${mentors.map((mentor) => mentor.user).join("','")}'`)
				.then((res) => res.data);
			const documents = await axios
				.get(`/api/documentsForAI?mentor=in:'${mentors.map((mentor) => mentor.id).join("','")}'`)
				.then((res) => res.data);
			mentors = mentors.map((mentor) => {
				const user = users.find((user) => user.id == mentor.user);
				const docs = documents.filter((document) => document.mentor == mentor.id);
				if (user) mentor.userData = user;
				if (document) mentor.documents = docs;
				return mentor;
			});
			console.log({ mentors });
		}
	});
	let newMentorModalOpen = false;
	let editMentor: Mentor = EmptyMentor;
	let editMode: 'update' | 'create' = 'update';
	const validate = (editMentor: Mentor) => {
		if (!editMentor.userData || !editMentor.userData.nickname) {
			alert('Nickname is required');
			return false;
		}
		if (!editMentor.userData || !editMentor.userData.avatarURL) {
			alert('Nickname is required');
			return false;
		}
		return true;
	};

	const reinstallAIBrain = async (mentor: Mentor) => {
		const response = await axios.get('/mentor/' + mentor.id);
		const events = await axios.get('/api/events?mentor=' + mentor.id).then((res) => res.data);
		const promises = events.map(async (event: Event) => {
			await axios.put('/api/mentors/' + mentor.id, {
				eventId: event.id
			});
		});
		console.log({ response, promises });
	};

	const onCreateClicked = async () => {
		if (!validate(editMentor)) return;
		const createdUser = await axios.post('/api/users', editMentor.userData).then((res) => res.data);
		const createdMentor = await axios
			.post('/api/mentors', { ...editMentor, user: createdUser.id, organization: organization.id })
			.then((res) => res.data);
		console.log({ createdMentor, createdUser });
		createdMentor.userData = createdUser;
		mentors = [...mentors, createdMentor];
		reinstallAIBrain(createdMentor);
		newMentorModalOpen = false;
	};
	const onUpdateClicked = async () => {
		if (!validate(editMentor)) return;
		if (!editMentor.userData?.id) return;
		const updatedUser = await axios
			.put('/api/users/' + editMentor.userData.id, editMentor.userData)
			.then((res) => res.data);
		console.log({ editMentor });
		const updatedMentor = await axios
			.put('/api/mentors/' + editMentor.id, {
				prompt: editMentor.prompt
			})
			.then((res) => res.data);
		console.log({ updatedMentor });
		updatedMentor.userData = updatedUser;
		mentors = mentors.map((mentor) => {
			if (mentor.id == updatedMentor.id) {
				return updatedMentor;
			}
			return mentor;
		});
		reinstallAIBrain(updatedMentor);
		newMentorModalOpen = false;
	};
	const onDeleteClicked = async () => {
		if (!confirm('Are you sure that you want to delete this mentor?')) return;
		await axios.delete('/api/mentors/' + editMentor.id).then((res) => res.data);
		if (!editMentor.userData) return;
		await axios.delete('/api/users/' + editMentor.userData.id).then((res) => res.data);
		await axios.delete('/api/documentsForAI?mentor=' + editMentor.id).then((res) => res.data);
		newMentorModalOpen = false;
	};
</script>

<h2>{_('Mentors')}</h2>
<div style="width:10rem">
	<button
		on:click={() => {
			editMentor = { ...EmptyMentor, id: crypto.randomUUID() };
			editMode = 'create';
			console.log({ editMentor });
			newMentorModalOpen = true;
		}}>{_('New Mentor')}</button
	>
</div>
{#if mentors.length}
	<FilterPagination inputArray={mentors} bind:paginated />
	<table>
		<thead>
			<tr>
				<th>{_('Nickname')}</th>
				<th>{_('Edit')}</th>
			</tr>
		</thead>
		<tbody>
			{#each paginated as mentor}
				<tr>
					<td>
						<img
							src={PresetAvatars.find((avatar) => avatar.url == mentor.userData?.avatarURL)
								?.thumbnailURL}
							style="width:3rem;height:3rem;border-radius:0.2rem;margin-right:0.4rem"
							alt=""
						/>
						{mentor.userData?.nickname || ''}
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
					editMentor.documents = [...editMentor.documents, ...fileDatas];
					e.target.value = '';
				}}
			/>
			{#if progress > 0}
				<progress max={100} value={progress} />
			{/if}
			{#if editMode == 'create'}
				<button
					on:click={() => {
						onCreateClicked();
					}}>{_('Create')}</button
				>
			{:else}
				<button
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
