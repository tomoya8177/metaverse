<script lang="ts">
	import type { Event } from '$lib/frontend/Classes/Event';
	import type { Room } from '$lib/frontend/Classes/Room';
	import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { page } from '$app/stores';

	import type { Organization } from '$lib/types/Organization';
	import axios from 'axios';
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import { Mentor } from '$lib/frontend/Classes/Mentor';
	import { BrandIcons } from '$lib/preset/BrandIcons';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';
	import { unescapeHTML } from 'mymetaverse-helper';
	export let editItem: SharedObject | Event;
	let rooms: Room[] = [];
	let mentors: Mentor[] = [];
	onMount(async () => {
		rooms = await axios.get('/api/rooms?organization=' + organization.id).then((res) => res.data);
		const mentorsResults = await axios
			.get('/api/mentors?organization=' + organization.id)
			.then((res) => res.data.map((mentor) => new Mentor(mentor)));
		const promises = mentorsResults.map((mentor) => mentor.init());
		await Promise.all(promises);
		mentors = mentorsResults;
	});
	export let organization: Organization;
	export let canAttachBrandIcon = true;
</script>

<InputWithLabel
	label={_('Link to Room/Mentor')}
	bind:value={editItem.linkTo}
	type="select"
	selects={[
		{
			name: _('No Link'),
			value: ''
		},
		...rooms.map((room) => {
			return {
				name: `[${_('Room')}] ${unescapeHTML(room.title)}`,
				value: `${$page.url.protocol}//${$page.url.host}/${organization.slug}/${room.slug}`
			};
		}),
		...mentors.map((mentor) => {
			return {
				name: `[${_('Mentor')}] ${mentor.userData?.nickname}`,
				value: `${$page.url.protocol}//${$page.url.host}/${organization.slug}/mentor/${mentor.id}`
			};
		})
	]}
/>
<InputWithLabel label={_('URL')} bind:value={editItem.linkTo} type="url" />
{#if editItem.linkTo}
	<InputWithLabel
		label={_('Link Type')}
		bind:value={editItem.linkType}
		type="select"
		selects={[
			{
				name: _('Open in New Tab'),
				value: '_blank'
			},
			{
				name: _('Open in Same Tab'),
				value: '_self'
			}
		]}
	/>
{/if}
{#if editItem.linkTo && canAttachBrandIcon}
	<strong>
		{_('Link Icons')}
	</strong>
	<div style="display:flex;flex-wrap:wrap;gap:0.4rem">
		{#each BrandIcons as icon}
			<div>
				<a
					href={'#'}
					on:click={() => {
						editItem.brandIcon = icon.iconURL;
					}}
				>
					<img
						class:active={editItem.brandIcon === icon.iconURL}
						src={icon.iconURL}
						alt={icon.name}
					/>
				</a>
			</div>
		{/each}
		<div>
			<a
				href={'#'}
				on:click={() => {
					editItem.brandIcon = '';
				}}
			>
				{_('No Icon')}</a
			>
		</div>
	</div>
{/if}
<InputWithLabel label={_('Description')} bind:value={editItem.description} type="textarea" />

<style>
	img {
		width: 4rem;
		height: 4rem;
		border-radius: 0.2rem;
	}
	.active {
		border: 0.4rem solid yellow;
	}
</style>
