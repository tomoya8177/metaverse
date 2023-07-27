<script lang="ts">
	import axios from 'axios';
	import { onMount } from 'svelte';
	import FilterPagination from '../Organisms/FilterPagination.svelte';
	import InputWithLabel from './InputWithLabel.svelte';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import type { Mentor } from '$lib/types/Mentor';
	import { EmptyMentor } from '$lib/preset/EmptyMentor';
	import AvatarSelectPane from '../Organisms/AvatarSelectPane.svelte';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import Icon from '../Atom/Icon.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import type { DocumentForAI } from '$lib/types/DocumentForAI';
	import { myAlert } from '$lib/frontend/toast';
	export let document: DocumentForAI;
	let paginated: Mentor[] = [];
	let organization: Organization;
	let mentors: Mentor[] = [];
	let progress: number = 0;
	uploader.progress.subscribe((value) => {
		progress = value;
	});

	let newMentorModalOpen = false;
	let editMentor: Mentor = EmptyMentor;
	let editMode: 'update' | 'create' = 'update';
	const validate = (editMentor: Mentor) => {
		if (!editMentor.userData || !editMentor.userData.nickname) {
			myAlert(_('Nickname is required'));
			return false;
		}
		if (!editMentor.userData || !editMentor.userData.avatarURL) {
			myAlert(_('Nickname is required'));
			return false;
		}
		return true;
	};
	export let onDeleteDone: () => void;
</script>

<div style="display:flex">
	<div style="flex:1">
		<a href={`/documentsForAI/${document.filename}`} target="_blank">{document.title}</a>
	</div>
	<div>
		<a
			href={'#'}
			on:click={async () => {
				if (!confirm(_('Are you sure that you want to delete this document?'))) return;
				await axios.delete('/api/documentsForAI/' + document.id).then((res) => res.data);
				onDeleteDone();
			}}
		>
			<Icon icon="delete" />
		</a>
	</div>
</div>
