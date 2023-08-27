<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import axios from 'axios';
	import { PUBLIC_XRCLOUD_API_KEY, PUBLIC_XRCLOUD_PROJECT_ID } from '$env/static/public';
	import { _ } from '$lib/i18n';

	export let data: PageData;
	let scenes = data.scenes;
	console.log({ scenes });
	onMount(async () => {
		const promises = scenes.map((scene) => {
			console.log(scene);
			return axios
				.get(`https://api.xrcloud.app/api/projects/${PUBLIC_XRCLOUD_PROJECT_ID}/scenes`, {
					headers: {
						Authorization: `Bearer ${PUBLIC_XRCLOUD_API_KEY}`
					}
				})
				.then((res) => res.data);
		});
		const results = await Promise.all(promises);
		results.forEach((result, index) => {
			console.log({ result });
			scenes[index].data = result.items[0];
		});
		const roomPromises = scenes.map((scene) => {
			return axios
				.get(
					`https://api.xrcloud.app/api/projects/${PUBLIC_XRCLOUD_PROJECT_ID}/scenes/${scene.data.id}/rooms`,
					{
						headers: {
							Authorization: `Bearer ${PUBLIC_XRCLOUD_API_KEY}`
						}
					}
				)
				.then((res) => res.data);
		});
		const roomResults = await Promise.all(roomPromises);
		roomResults.forEach((result, index) => {
			console.log({ result });
			scenes[index].rooms = result.items;
		});
	});
	const onCreateClicked = async () => {
		console.log('onCreateClicked');
		const name = prompt('Title');
		if (name) {
			console.log(name);
		}
		const response = await axios.post(
			`https://api.xrcloud.app/api/projects/${PUBLIC_XRCLOUD_PROJECT_ID}/scenes`,
			{
				name: name
			}
		);
	};
</script>

<section>
	<a
		href={'#'}
		role="button"
		on:click={() => {
			onCreateClicked();
		}}
	>
		{_('Create Scene')}
	</a>
</section>
<section>
	{#each scenes as scene}
		<div>
			<img src={scene.data?.thumbnailUrl} alt={scene.data?.name} style="width:10rem" />
			{scene.data?.name}
			<a href={scene.data?.sceneModificationUrl} target="_blank" rel="noopener noreferrer">
				{_('Edit')}
			</a>
			<a
				role="button"
				href={'#'}
				on:click={async () => {
					//create room
					const name = prompt('Room Name');
					const response = await axios.post(
						`https://api.xrcloud.app/api/projects/${PUBLIC_XRCLOUD_PROJECT_ID}/scenes/${scene.data.id}/rooms`
					);
					console.log({ response });
				}}
			>
				{_('Create Room')}
			</a>
			{#each scene.rooms || [] as room}
				<div>
					{room.name}
					<a href={room.roomUrl} target="_blank" rel="noopener noreferrer">
						{_('Enter')}
					</a>
				</div>
			{/each}
		</div>
	{/each}
</section>
