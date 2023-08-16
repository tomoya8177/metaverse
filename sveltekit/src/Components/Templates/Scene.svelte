<script lang="ts">
	import EnterRoomDialog from '../Organisms/EnterRoomDialog.svelte';

	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import 'aframe-audio-analyser';
	import { onDestroy, onMount } from 'svelte';
	import { ChatMessagesStore, RoomStore, TextChatOpen, UserStore, AISpeaks } from '$lib/store';

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
	import InputWithLabel from '../Molecules/InputWithLabel.svelte';
	import { escapeHTML } from '$lib/math/escapeHTML';
	import type { PageData } from '../../routes/[organizationSlug=notRoute]/[roomSlug]/$types';
	import { aiSpeaksOut } from '$lib/frontend/aiSpeaksOut';
	import { Message } from '$lib/frontend/Classes/Message';
	import { DateTime } from 'luxon';
	import { cookies } from '$lib/frontend/cookies';
	import { callAIMentor } from '$lib/frontend/callAIMentor';
	import { nippleControl } from '$lib/frontend/Classes/NippleControl';
	import type { Room } from '$lib/frontend/Classes/Room';
	import { sharedObjects } from '$lib/frontend/Classes/SharedObjects';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import { PUBLIC_IS_DEV } from '$env/static/public';
	import { videoChat } from '$lib/frontend/Classes/VideoChat';
	export let data: PageData;
	export let room: Room;
	let organization: Organization = data.organization;
	AFRAME.registerComponent('on-scene-loaded', {
		init: function () {
			this.el.addEventListener('loaded', () => {
				onSceneLoaded();
			});
		}
	});
	window.onpopstate = function (event) {
		delete AFRAME.components['on-scene-loaded'];
	};
	let sceneLoaded = false;
	let readyToConnect = false;
	let me: Me;
	const onSceneLoaded = async () => {
		sceneLoaded = true;
		actionHistory.send('enteringRoom');
		me = new Me($UserStore);
		// me.nickname = $UserStore.nickname;
		Users.add(me);
		// $UserStore.unit = me;
		await me.setLastPosition(room);
		// me.avatarURL =
		// 	$UserStore.avatarURL || '/preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
		//me.twilioConnect(room.id)
		document.addEventListener('touchstart', () => {
			//activate the nipple control
			me.enableTouch();
			nippleControl.show();
		});
		document.onkeydown = (e) => {
			//if key is W
		};
		//load mentor user
		if (room.mentor) {
			const mentor = await axios.get('/api/mentors/' + room.mentor).then((res) => res.data);
			mentor.userData = await axios.get('/api/users/' + mentor.user).then((res) => res.data);
			const mentorUnit = new Unit(mentor.userData);
			mentorUnit.position = { x: 0, y: 0, z: 3 };
			//	mentorUnit.nickname = mentor.userData.nickname;
			//	mentorUnit.avatarURL = mentor.userData.avatarURL;
			mentorUnit.el.setAttribute('ai-mentor', '');
			mentorUnit.avatar?.setAttribute('move-mouth', 'userId:' + mentor.userData.id);
			Users.add(mentorUnit);
		}
	};

	onDestroy(() => {
		messageUnlisteners();
	});
	let QADialogOpen = false;
	let starValue = 5;
	let feedback = '';
</script>

{#if !readyToConnect}
	<EnterRoomDialog
		whenChatConnected={async () => {
			await loadSharedObjects(room.id);
			const existingFeedback = await axios
				.get('/api/feedbacks?campaign=1&user=' + $UserStore.id)
				.then((res) => res.data);
			if (!existingFeedback.length) {
				setTimeout(() => {
					QADialogOpen = true;
				}, 120000); //in 2 minutes, the QA dialog will show up
			}
			if (!room.mentor) return;
			const response = await axios.post(
				'/mentor/' + room.mentor + '/' + videoChat.room?.sid || '',
				{
					type: 'room',
					roomId: room.id,
					body: _("Hello! I just entered the room. I'm ") + $UserStore.nickname,
					channelId: videoChat.room?.sid || ''
				}
			);
			console.log({ response });
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
			actionHistory.send('enterRoom');

			const message = new Message({
				room: room.id,
				user: room.mentorData.userData.id,
				body: response.data.text,
				createdAt: DateTime.now().toISO(),
				isTalking: true
			});
			message.createSendOutAndPush();
			callAIMentor(room.mentorData);

			TextChatOpen.set(true);
			if (!$AISpeaks) {
				return;
			}
			room.mentorData.speak(message.body);
			//			aiSpeaksOut(message.body, Users.find(room.mentorData.user) || null);
		}}
		{me}
		bind:readyToConnect
	/>
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
				<div style="display:flex">
					{#each [1, 2, 3, 4, 5] as i}
						<a
							href={'#'}
							on:click={() => {
								starValue = i;
							}}
							class="star"
							class:selected={starValue >= i}
						>
							<Icon size={4} icon="star" />
						</a>
					{/each}
				</div>
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
	<a-assets />
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
        groundYScale:20
        "
		/>
	{:else}
		<a-entity
			environment="
				preset: default;
				ground:none
				"
		/>
	{/if}
	{#if room.environmentModelURL}
		<a-gltf-model src={room.environmentModelURL} position="0 0.01 0" />
	{/if}
	{#if room.navMeshModelURL}
		<a-gltf-model src={room.navMeshModelURL} position="0 0.01 0" visible="false" nav-mesh />
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
	<SceneUIs {me} {organization} {room} />
{/if}

<style>
	.star {
		flex: 1;
		text-align: center;
		display: inline-block;
		color: gray;
	}
	.star.selected {
		color: orange;
	}
</style>
