import { describe } from 'vitest';
import Login from './Login.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { db } from '$lib/backend/db';

describe('Register', () => {
	const newEmail = 'test' + Math.random() + '@test.com';
	test('Should be rendered correctly', async () => {
		render(Login, {
			props: {
				organization: '',
				room: null
			}
		}); //correct u
		const emailInput = screen.getByLabelText('Email');
		const proceedButton = screen.getByRole('button');
		expect(emailInput).toBeInTheDocument();
		expect(proceedButton).toBeInTheDocument();
	});
	test('Try with Wrong Code', async () => {
		render(Login, {
			props: {
				organization: '',
				room: null
			}
		}); //correct u
		const emailInput = screen.getByLabelText('Email');
		const proceedButton = screen.getByRole('button');
		await fireEvent.input(emailInput, { target: { value: newEmail } });
		await fireEvent.click(proceedButton);
		await new Promise((r) => setTimeout(r, 2000));
		const user = (await db.query(`select * from users where email='${newEmail}'`))[0];
		const VerifyButton = screen.getByText('Verify');
		const codeInput = screen.getByLabelText('Verification Code');
		expect(VerifyButton).toBeInTheDocument();
		expect(codeInput).toBeInTheDocument();
		//type wrong verification
		await fireEvent.input(codeInput, { target: { value: '0012' } });
		await fireEvent.click(VerifyButton);
		await new Promise((r) => setTimeout(r, 1000));
		const wrongCodeMessage = screen.getByText('Wrong code');
		expect(wrongCodeMessage).toBeInTheDocument();
	}, 10000);
	test('Try with Correct Code', async () => {
		render(Login, {
			props: {
				organization: '',
				room: null
			}
		}); //correct u
		const emailInput = screen.getByLabelText('Email');
		const proceedButton = screen.getByRole('button');
		await fireEvent.input(emailInput, { target: { value: newEmail } });
		await fireEvent.click(proceedButton);
		await new Promise((r) => setTimeout(r, 2000));
		const user = (await db.query(`select * from users where email='${newEmail}'`))[0];
		const VerifyButton = screen.getByText('Verify');
		const codeInput = screen.getByLabelText('Verification Code');
		expect(VerifyButton).toBeInTheDocument();
		expect(codeInput).toBeInTheDocument();
		//type wrong verification
		//check if error thrown

		await fireEvent.input(codeInput, { target: { value: user.verificationCode } });
		await fireEvent.click(VerifyButton);
		await new Promise((r) => setTimeout(r, 1000));
		//any error??
		//screen gets reload
		const response = await db.query(`delete from users where id='${user.id}'`);
		console.log({ response });
		expect(response.affectedRows).toBe(1);
	}, 10000);
});
