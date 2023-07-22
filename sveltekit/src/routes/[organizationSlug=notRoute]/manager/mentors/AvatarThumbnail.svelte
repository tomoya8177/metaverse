<script lang="ts">
	import DocumentForAIRow from '../../../../Components/Molecules/DocumentForAIRow.svelte';

	import axios from 'axios';
	import { onMount } from 'svelte';
	import FilterPagination from '../../../../Components/Organisms/FilterPagination.svelte';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import ModalCloseButton from '../../../../Components/Atom/ModalCloseButton.svelte';
	import type { User } from '$lib/frontend/Classes/User';
	import type { Organization } from '$lib/types/Organization';
	import { _ } from '$lib/i18n';
	import { page, updated } from '$app/stores';
	import type { Mentor } from '$lib/types/Mentor';
	import { EmptyMentor } from '$lib/preset/EmptyMentor';
	import AvatarSelectPane from '../../../../Components/Organisms/AvatarSelectPane.svelte';
	import { PresetAvatars } from '$lib/preset/PresetAvatars';
	import { uploader } from '$lib/frontend/Classes/Uploader';
	import Icon from '../../../../Components/Atom/Icon.svelte';
	import { cookies } from '$lib/frontend/cookies';
	import type { Event } from '$lib/frontend/Classes/Event';
	import type { DocumentForAI } from '$lib/types/DocumentForAI';
	import { reinstallAIBrain } from '$lib/frontend/reinstallAIBrain';
	export let url: string;
</script>

<img
	src={PresetAvatars.find((avatar) => avatar.url == url)?.thumbnailURL}
	style="width:3rem;height:3rem;border-radius:0.2rem;margin-right:0.4rem"
	alt=""
/>
