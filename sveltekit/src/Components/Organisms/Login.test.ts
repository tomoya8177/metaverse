import { describe } from 'vitest';
import Login from './Login.svelte';

describe('Register', () => {
	render(Login, {
		props: {
			organization: '',
			room: null
		}
	}); //correct u
});
