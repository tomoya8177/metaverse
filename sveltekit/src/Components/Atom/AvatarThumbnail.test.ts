import { afterEach, beforeEach, describe, expect, it, test } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import AvatarThumbnail from './AvatarThumbnail.svelte';
import { PresetAvatars } from '$lib/preset/PresetAvatars';
describe('AvatarThumbnail', () => {
	let instance: any = null;

	beforeEach(() => {
		//create instance of the component and mount it
	});

	afterEach(() => {
		//destory/unmount instance
	});

	test('shows the thumbnail when rendered', () => {
		//get random one from presetAvatars
		const avatar = PresetAvatars[Math.floor(Math.random() * PresetAvatars.length)];
		render(AvatarThumbnail, {
			props: { url: avatar.url }
		}); //correct url
		const img = screen.getByRole('img');
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', avatar.thumbnailURL);
	});

	test('that the AvatarThumbnail is rendered', () => {
		expect(instance).toBeDefined();
	});
});
