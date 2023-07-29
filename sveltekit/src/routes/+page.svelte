<script lang="ts">
	import { _ } from '$lib/i18n';
	import { UserStore } from '$lib/store';
	import Icon from '../Components/Atom/Icon.svelte';
	import NippleControl from '../Components/Atom/NippleControl.svelte';
	import Navigation from '../Components/Organisms/Navigation.svelte';
	import UnderConstruction from '../Components/Templates/UnderConstruction.svelte';
</script>

<Navigation />
<div class="container">
	{#if $UserStore.isAdmin}
		<div style="position:absolute;top:0px;right:0px">
			<a href="/admin" role="button"> Admin console</a>
			<p>
				<small>Only seen for admins</small>
			</p>
		</div>
	{/if}
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

<style>
	.container {
		position: relative;
	}
</style>
