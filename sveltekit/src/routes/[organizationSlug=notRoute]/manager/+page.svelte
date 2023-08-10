<script lang="ts">
	import TeamIconEditor from './TeamIconEditor.svelte';
	import { deleteOrganization } from '$lib/frontend/deleteOrganization';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import ActionHistoryTable from '../../admin/ActionHistoryTable.svelte';
	import { onMount } from 'svelte';
	import { escapeHTML } from '$lib/math/escapeHTML';
	export let data: PageData;
	let organization = data.organization;
	let actionHistories = data.actionHistories;
	onMount(() => {
		actionHistory.send('managerConsole', {
			...organization,
			title: escapeHTML(organization.title)
		});
	});
</script>

<section>
	<h3>{_('Icon')}</h3>
	<div>
		<TeamIconEditor {organization} />
	</div>
</section>
<section>
	<h3>{_('Access Logs')}</h3>
	<ActionHistoryTable {actionHistories} />
</section>

<h3>{_('Delete Organization')}</h3>

<button
	on:click={async () => {
		if (!confirm(_('Are you sure that you want to delete this organization?'))) return;
		actionHistory.send('deleteOrganization', {
			...organization,
			title: escapeHTML(organization.title)
		});
		await deleteOrganization(organization);
		location.href = '/';
	}}
	class="secondary">{_('Delete Organization')}</button
>
