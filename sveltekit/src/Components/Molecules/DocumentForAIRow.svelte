<script lang="ts">
	import axios from 'axios';
	import { _ } from '$lib/i18n';
	import Icon from '../Atom/Icon.svelte';
	import type { DocumentForAI } from '$lib/types/DocumentForAI';
	import { myConfirm } from '$lib/frontend/toast';
	export let document: DocumentForAI;

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
				if (!(await myConfirm(_('Are you sure that you want to delete this document?')))) return;
				await axios.delete('/api/documentsForAI/' + document.id).then((res) => res.data);
				onDeleteDone();
			}}
		>
			<Icon icon="delete" />
		</a>
	</div>
</div>
