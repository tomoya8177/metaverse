<script lang="ts">
	import { _ } from '$lib/i18n';
	import Icon from '../Components/Atom/Icon.svelte';
	import NippleControl from '../Components/Atom/NippleControl.svelte';
	import Navigation from '../Components/Organisms/Navigation.svelte';
	import UnderConstruction from '../Components/Templates/UnderConstruction.svelte';
</script>

<Navigation />
<div class="container">
	<section style="margin-top:6rem">
		<a role="button" href={'/gnv/firsttest'}>
			<Icon icon="login" />

			{_('Enter Sample Room')}
		</a>
	</section>
	<section>
		<a role="button" href={'/create-organization'}>
			<Icon icon="apartment" />

			{_('Create New Organization')}
		</a>
	</section>
</div>
