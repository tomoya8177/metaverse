import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { Server } from 'socket.io';
import axios from 'axios';

export default defineConfig({
	plugins: [sveltekit()],
	preview: {
		port: 5173,
		strictPort: false
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
