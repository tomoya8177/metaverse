import { afterEach, beforeEach, describe, expect, it, test } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import AvatarPreview from './AvatarPreview.svelte';
import { PresetAvatars } from '$lib/preset/PresetAvatars';
describe('AvatarPreview', () => {
	let instance: any = null;

	beforeEach(() => {
		//create instance of the component and mount it
	});

	afterEach(() => {
		//destory/unmount instance
	});

	test('that the AvatarPreview is rendered', () => {
		expect(instance).toBeDefined();
	});
	test('shows the preview when rendered', () => {
		//get random one from presetAvatars
		const avatar = PresetAvatars[Math.floor(Math.random() * PresetAvatars.length)];
		render(AvatarPreview, {
			props: { url: avatar.url }
		}); //correct url
		const preview = document.getElementById('avatarPreview');
		expect(preview).toBeInTheDocument();
	});
});
