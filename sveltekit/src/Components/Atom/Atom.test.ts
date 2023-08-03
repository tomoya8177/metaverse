import { afterEach, beforeEach, describe, expect, it, test } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import AvatarPreview from './AvatarPreview.svelte';
import { PresetAvatars } from '$lib/preset/PresetAvatars';
import AvatarThumbnail from './AvatarThumbnail.svelte';
describe('Atom Components', () => {
	const avatar = PresetAvatars[Math.floor(Math.random() * PresetAvatars.length)];
	it('AvatarThumbnail is rendered', () => {
		render(AvatarThumbnail, {
			props: { url: avatar.url }
		}); //correct u
		const img = screen.getByRole('img');
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', avatar.thumbnailURL);
	});
	it('AvatarPreview is rendered', () => {
		render(AvatarPreview, {
			props: {
				url: avatar.url,
				thumbnailURL: avatar.thumbnailURL
			}
		}); //correct u
		const img = screen.getByRole('img');

		expect(img).toBeInTheDocument();
	});
});
