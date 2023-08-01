<script lang="ts">
	import TeamIconEditor from './TeamIconEditor.svelte';
	import { deleteOrganization } from '$lib/frontend/deleteOrganization';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	import { actionHistory } from '$lib/frontend/Classes/actionHistory';
	export let data: PageData;
	let organization = data.organization;
</script>

<section>
	<h3>{_('Icon')}</h3>
	<div>
		<TeamIconEditor {organization} />
	</div>
</section>
<h3>{_('Delete Organization')}</h3>

<button
	on:click={async () => {
		if (!confirm(_('Are you sure that you want to delete this organization?'))) return;
		actionHistory.send('deleteOrganization', { organization });
		await deleteOrganization(organization);
		location.href = '/';
	}}
	class="secondary">{_('Delete Organization')}</button
>
