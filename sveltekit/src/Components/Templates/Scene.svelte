<script lang="ts">
	import EnterRoomDialog from '../Organisms/EnterRoomDialog.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import 'aframe-audio-analyser';
	import { onDestroy, onMount } from 'svelte';
	import { UserStore } from '$lib/store';

	import '$lib/AframeComponents';
	import { Me } from '$lib/frontend/Classes/Me';
	import { Users } from '$lib/frontend/Classes/Users';
	import SceneUIs from '../Organisms/SceneUIs.svelte';
	import { messageUnlisteners } from '$lib/frontend/messageListeners';
	import axios from 'axios';
	import type { Organization } from '$lib/types/Organization';
	import { loadSharedObjects } from '$lib/frontend/loadSharedObjects';
	import { Unit } from '$lib/frontend/Classes/Unit';
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { myAlert, toast } from '$lib/frontend/toast';
	import ModalCloseButton from '../Atom/ModalCloseButton.svelte';
	import { _ } from '$lib/i18n';
	import Icon from '../Atom/Icon.svelte';
	import { escapeHTML } from 'mymetaverse-helper';
	import type { PageData } from '../../routes/[organizationSlug=notRoute]/[roomSlug]/$types';
	import { Message } from '$lib/frontend/Classes/Message';
	import { DateTime } from 'luxon';
	import { cookies } from '$lib/frontend/cookies';
	import { nippleControl } from '$lib/frontend/Classes/NippleControl';
	import type { Room } from '$lib/frontend/Classes/Room';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import { PUBLIC_IS_DEV } from '$env/static/public';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';
	import { environmentPresets } from '$lib/preset/EnvironmentPresets';
	import { EnvironmentModelPresets } from '$lib/preset/EnvironmentModelPresets';
	import type { Entity } from 'aframe';
	import RatingStars from '../Molecules/RatingStars.svelte';
	export let data: PageData;
	export let room: Room;
	let organization: Organization = data.organization;

	//check if the component is already registered
	if (!AFRAME.components['on-scene-loaded']) {
		AFRAME.registerComponent('on-scene-loaded', {
			init: function () {
				this.el.addEventListener('loaded', () => {
					onSceneLoaded(this.el);
				});
			}
		});
	}
	window.onpopstate = function (event) {
		delete AFRAME.components['on-scene-loaded'];
	};
	let sceneLoaded = false;
	const onSceneLoaded = async (sceneEl: Entity) => {
		sceneLoaded = true;
		actionHistory.send('enteringRoom');
		console.log('ME creating in room', room);
		$UserStore.initMe(room.id);
		Users.add($UserStore.unit as Unit);
		//		await me.setLastPosition(room);
		document.addEventListener('touchstart', () => {
			if (!$UserStore.unit) return;
			if ($UserStore.unit instanceof Me) $UserStore.unit?.enableTouch();
			nippleControl.show();
		});

		//load mentor user
		if (room.mentor) {
			console.log({ ...room.mentorData, userData: { ...room.mentorData.userData } });
			const mentorUnit = new Unit(room.mentorData.userData);
			mentorUnit.position = { x: 0, y: 0, z: 3 };
			mentorUnit.el.setAttribute('ai-mentor', '');
			mentorUnit.el.setAttribute('move-mouth', 'userId:' + room.mentorData.userData.id);
			Users.add(mentorUnit);
			room.mentorData.setEl();
		}
		sharedObjects.empty();
		await room.loadSharedObjects();
	};

	onDestroy(() => {
		messageUnlisteners();
	});
	let QADialogOpen = false;
	let starValue = 5;
	let feedback = '';
	let entryStatus: string = '';
	room.entryStatus.subscribe(async (status) => {
		entryStatus = status;
		if (entryStatus == 'connecting' && room.mentor) {
			const response = await axios.post(
				'/mentor/' + room.mentor + '/' + videoChat.room?.sid || '',
				{
					type: 'room',
					roomId: room.id,
					body:
						_("Hello! I'm") +
						$UserStore.nickname +
						_('You can just answer me hi. In the language of my setting. My locale is set to ') +
						cookies.get('locale'),
					channelId: videoChat.room?.sid || ''
				}
			);
			const message = new Message({
				room: room.id,
				user: room.mentorData.userData.id,
				body: response.data.text,
				createdAt: DateTime.now().toISO(),
				isTalking: true
			});
			message.createSendOutAndPush();
			room.mentorData.come($UserStore.unit as Me);
			room.mentorData.speak(message.body);
		}
		if (entryStatus == 'entered') {
			const existingFeedback = await axios
				.get('/api/feedbacks?campaign=1&user=' + $UserStore.id)
				.then((res) => res.data);
			if (!existingFeedback.length) {
				setTimeout(() => {
					QADialogOpen = true;
				}, 120000); //in 2 minutes, the QA dialog will show up
			}
			const twoHoursAgo = convertLocalToUTC(DateTime.now().minus({ hours: 2 }).toISO()).replace(
				'T',
				' '
			);
			const lastAction = await axios
				.get(
					`/api/coinHistory?user=${$UserStore.id}&action=enterRoom&createdAt=gt:${twoHoursAgo}&order=desc&limit=1`
				)
				.then((res) => res.data);
			//if last action is 4 hours ago or more, give 10 coins
			if (lastAction.length == 0) {
				await $UserStore.addCoin('enterRoom', 10);
				toast(_('You got 10 coins for being active.'));
			}
			if (room.environment?.component) {
				scene.setAttribute(
					room.environment.component,
					(room.environment.componentDefaultValues || '') + ';userId:' + $UserStore.id
				);
			}
		}
	});
</script>

{#if entryStatus != 'entered'}
	<EnterRoomDialog {room} {organization} />
{/if}
{#if QADialogOpen}
	<dialog open>
		<article>
			<ModalCloseButton
				onClick={() => {
					QADialogOpen = false;
				}}
			/>
			<h3>
				{_('Rate This Metaverse!')}
			</h3>
			<section>
				<RatingStars bind:value={starValue} />
			</section>
			<InputWithLabel label={_('Give us your feedback')} type="textarea" bind:value={feedback} />
			<button
				on:click={async () => {
					if (!room) return;
					const feedbackObj = {
						organization: room.organization,
						room: room.id,
						user: $UserStore.id,
						star: starValue,
						data: JSON.stringify({
							comment: escapeHTML(feedback)
						}),
						campaign: '1'
					};
					await axios.post('/api/feedbacks', feedbackObj);
					actionHistory.send('feedback', feedbackObj);
					QADialogOpen = false;
					toast(_('Thank you for your feedback!'));
				}}
			>
				{_('Send')}
			</button>
			<button
				class="secondary"
				on:click={() => {
					QADialogOpen = false;
					setTimeout(() => {
						QADialogOpen = true;
					}, 120000);
				}}
			>
				{_('Later')}
			</button>
		</article>
	</dialog>
{/if}
<a-scene
	on-scene-loaded
	renderer="colorManagement: true"
	id="scene"
	colorManagement="true"
	vr-mode-ui="enabled: false"
	ar-mode-ui="enabled: false"
	cursor="rayOrigin: mouse"
>
	<a-assets>
		<canvas width="1024" height="1024" id="selfieCanvas" />
	</a-assets>
	<a-cursor raycaster="objects: .clickable" />
	<a-plane
		id="rayCatcher"
		width="20"
		height="20"
		position="0 -100 0"
		rotation="0 0 0"
		visible="false"
	/>
	{#if room.environmentPreset != 'none'}
		<a-entity
			environment="
        preset:{room.environmentPreset || 'default'};
        groundYScale:20,
        "
		/>
	{:else}
		<a-entity
			environment="
				preset: default;
				ground:none,
				"
		/>
	{/if}
	{#if room.environmentModelURL}
		{@const preset = EnvironmentModelPresets.find(
			(preset) => preset.modelURL == room.environmentModelURL
		)}
		<a-gltf-model
			src={room.environmentModelURL}
			position="0 0.01 0"
			scale={`${preset?.scale || 1} ${preset?.scale || 1} ${preset?.scale || 1}`}
		/>
		{#if room.navMeshModelURL}
			<a-gltf-model
				src={room.navMeshModelURL}
				position="0 0.01 0"
				visible="false"
				nav-mesh
				scale={`${preset?.scale || 1} ${preset?.scale || 1} ${preset?.scale || 1}`}
			/>
		{/if}
	{:else}
		<a-plane
			id="ground"
			shadow="receive: true"
			position="0 0 0"
			rotation="-90 0 0"
			width="20"
			height="20"
			nav-mesh
			visible="false"
		/>
	{/if}
</a-scene>
{#if sceneLoaded}
	<SceneUIs {organization} {room} />
{/if}
