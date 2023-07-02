<script lang="ts">
	import 'aframe';
	import 'aframe-environment-component';
	import 'aframe-extras';
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { EventStore, RigStore, UserStore, type xyz } from '$lib/store';
	import axios from 'axios';
	import { Unit } from '$lib/Classes/Unit';

	import '$lib/AframeComponents';
	import { Me } from '$lib/Classes/Me';
	import { Users } from '$lib/Classes/Users';
	import { VideoChat } from '$lib/Classes/VideoChat';
	let videoChat: VideoChat;
	onMount(async () => {
		console.log({ io });
		console.log($UserStore.id);
		io.emit('userId', $UserStore.id); // Send the message
		io.emit('enterRoom', $EventStore.id); // Send the message
		setTimeout(async () => {
			const me = new Me($UserStore.id);
			Users.add(me);
			if ($UserStore.lastRoom === $EventStore.id && $UserStore.lastPosition) {
				const lastPosition = JSON.parse($UserStore.lastPosition);
				me.position = { ...lastPosition.position };
				me.rotation = { ...lastPosition.rotation };
				me.avatarURL =
					$UserStore.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
				//not setting nickname for Me
				io.emit('position', { position: lastPosition.position, rotation: lastPosition.rotation });
			}
			//me.twilioConnect($EventStore.id);
			//me.cometChat($EventStore, $UserStore.nickname);
			videoChat = new VideoChat($EventStore, $UserStore.id);
			if ($EventStore.allowAudio) {
				await videoChat.connect();
				videoChat.enableAudio();
				if ($EventStore.allowVideo) {
					videoChat.enableVideo();
				}
			}
		}, 1000);
	});
	io.on('userLeftRoom', (data) => {
		if (data.from == $UserStore.id) return;
		//user left
		console.log('userLeftRoom', data);
		const unit = Users.find(data.from);
		unit?.leave();
		Users.remove(data.from);
		let container = document.getElementById('media-container' + data.from);
		console.log(container);
		container?.remove();
	});
	io.on('updateProfile', (profile: { nickname: string }) => {
		const unit = Users.find($UserStore.id);
		if (!unit) return;
		unit.nickname = profile.nickname;
	});
	io.on('userInRoom', async (data) => {
		if (data.from == $UserStore.id) return;
		//new uer joined
		io.emit('position', { position: $RigStore.position, rotation: $RigStore.rotation });
		//user el not created yer
		const user = await axios.get('/api/users/' + data.from).then((res) => res.data);
		if (document.getElementById(data.from)) return;
		const userUnit = new Unit(user.id);
		userUnit.nickname = user.nickname;
		userUnit.avatarURL =
			user.avatarURL || 'preset-avatars/b3c158be8e39d28a8cc541052c7497cfa9d7bdbe.glb';
		Users.add(userUnit);
	});
	io.on('position', (data: { from: string; position: { position: xyz; rotation: xyz } }) => {
		if (data.from == $UserStore.id) return;
		const user = Users.find(data.from);
		if (!user) return;
		user.position = data.position.position;
		user.rotation = data.position.rotation;
	});
</script>

<a-scene id="scene" renderer="gammaOutput: true">
	<a-entity
		environment="
        preset:forest;
        shadow:true;
        ground:canyon;
				skyColor:#ccf;
				horizonColor:#fff;
        groundYScale:20
        "
	/>
	<a-plane
		id="ground"
		shadow="receive: true"
		position="0 0 0"
		rotation="-90 0 0"
		width="20"
		height="20"
		nav-mesh
		visible="false"
		color="#7BC8A4"
	/>
</a-scene>
<div id="media-container">Medias</div>

<style>
	#media-container {
		position: absolute;
		top: 0;
		right: 0;
		width: 400px;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
	}
</style>
