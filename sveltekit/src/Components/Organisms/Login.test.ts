import { describe, expect, it, test } from 'vitest';
import Login from './Login.svelte';
import { render, screen } from '@testing-library/svelte';

describe('Register', () => {
	it('should render inputs', () => {
		render(Login);
		const emailInput = screen.getByLabelText('Email');
		expect(emailInput).toBeInTheDocument();
	});
});
