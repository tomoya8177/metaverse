<script lang="ts">
	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { Toast } from '$lib/store';

	export let label: string = '';
	export let value: string | number | boolean = '';
	export let readonly: boolean = false;
	export let copiable: boolean = false;
	export let type:
		| 'number'
		| 'checkbox'
		| 'text'
		| 'url'
		| 'email'
		| 'password'
		| 'date'
		| 'tel'
		| 'time'
		| 'textarea'
		| 'switch'
		| 'range'
		| 'select' = 'text';
	export let selects: { name: string | undefined; value: string | number | undefined }[] = [];
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let onChange: (e: Event) => void = () => {};
	export let onInput: (e: Event) => void = () => {};
	export let step = 1;
	export let min = 0;
	export let max = 100;
	export let meta: string = '';
</script>

<div class="field">
	<div style="flex:1">
		<label class="label">
			{#if type != 'checkbox' && type != 'switch'}
				{label}
			{/if}
			{#if required}
				<span class="has-text-danger">*</span>
			{/if}
			{#if meta}
				<br />
				<small>{meta}</small>
			{/if}

			<div class="control">
				{#if type == 'text'}
					<input on:change={onChange} type="text" bind:value {disabled} {readonly} />
				{:else if type == 'url'}
					<input on:change={onChange} type="url" bind:value {disabled} {readonly} />
				{:else if type == 'tel'}
					<input on:change={onChange} type="tel" bind:value {disabled} {readonly} />
				{:else if type == 'number'}
					<input on:change={onChange} type="number" bind:value {disabled} {readonly} />
				{:else if type == 'email'}
					<input on:change={onChange} type="email" bind:value {disabled} {readonly} />
				{:else if type == 'date'}
					<input on:change={onChange} type="date" bind:value {disabled} {readonly} />
				{:else if type == 'time'}
					<input on:change={onChange} type="time" bind:value {disabled} {readonly} />
				{:else if type == 'password'}
					<input on:change={onChange} type="password" bind:value {disabled} {readonly} />
				{:else if type == 'textarea'}
					<textarea on:change={onChange} class="textarea" bind:value {disabled} {readonly} />
				{:else if type == 'range'}
					<input
						type="range"
						{min}
						{step}
						{max}
						{readonly}
						bind:value
						id="range"
						on:change={onChange}
						on:input={onInput}
					/>
				{:else if type == 'checkbox'}
					<label>
						<input type="checkbox" bind:checked={value} {disabled} {readonly} />
						{label}
					</label>
				{:else if type == 'switch'}
					<label>
						<input
							type="checkbox"
							role="switch"
							bind:checked={value}
							on:change={onChange}
							{disabled}
							{readonly}
						/>
						{label}
					</label>
				{:else if type == 'select'}
					<select bind:value {disabled} on:change={onChange}>
						{#each selects as option}
							{#if typeof option.value != 'undefined'}
								<option value={option.value}>{option.name}</option>
							{/if}
						{/each}
					</select>
				{/if}
			</div>
		</label>
	</div>
	{#if copiable}
		<div style="align-self:center">
			<button
				class="button is-small"
				on:click={() => {
					navigator.clipboard.writeText(value.toString());
					toast(_('Copied to clipboard'));
				}}
			>
				{_('Copy')}
			</button>
		</div>
	{/if}
</div>

<style>
	.textarea {
		margin-bottom: 0px;
	}
	.field {
		display: flex;
		gap: 0.6rem;
	}
</style>
