<script lang="ts">
	import { actionHistory } from '$lib/frontend/Classes/ActionHistory';
	import { cookies } from '$lib/frontend/cookies';
	import { onMount } from 'svelte';
	let chosenLanguage: string;
	onMount(() => {
		chosenLanguage = cookies.get('locale') || 'en';
	});
</script>

<select
	bind:value={chosenLanguage}
	on:change={(e) => {
		//set it to cookie
		console.log(chosenLanguage);
		cookies.set('locale', chosenLanguage, { expires: 365 * 10, secure: true, sameSite: 'None' });
		actionHistory.send('changeLanguage', { language: chosenLanguage });
		location.reload();
	}}
>
	<option value="en">English</option>
	<option value="es">Español</option>
	<option value="fr">Français</option>
	<option value="it">Italiano</option>
	<option value="ru">Русский</option>
	<option value="de">Deutsch</option>
	<option value="sv">Svenska</option>
	<option value="nl">Nederlands</option>
	<option value="pt">Português</option>
	<option value="hi">हिन्दी</option>
	<option value="zh">中文</option>
	<option value="ko">한국어</option>
	<option value="ja">日本語</option>
</select>
