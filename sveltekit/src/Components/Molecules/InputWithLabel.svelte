<script lang="ts">
	export let label: string = '';
	export let value: string | number | boolean = '';
	export let type:
		| 'number'
		| 'checkbox'
		| 'text'
		| 'email'
		| 'password'
		| 'date'
		| 'time'
		| 'textarea'
		| 'switch'
		| 'select' = 'text';
	export let selects: { name: string | undefined; value: string | number | undefined }[] = [];
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let onChange: () => void = () => {};
</script>

<div class="field">
	<label class="label">
		{#if type != 'checkbox' && type!='switch'}
			{label}
		{/if}
		{#if required}
			<span class="has-text-danger">*</span>
		{/if}

		<div class="control">
			{#if type == 'text'}
				<input on:change={onChange} type="text" bind:value {disabled} />
			{:else if type == 'number'}
				<input on:change={onChange} type="number" bind:value {disabled} />
			{:else if type == 'email'}
				<input on:change={onChange} type="email" bind:value {disabled} />
			{:else if type == 'date'}
				<input on:change={onChange} type="date" bind:value {disabled} />
			{:else if type == 'time'}
				<input on:change={onChange} type="time" bind:value {disabled} />
			{:else if type == 'password'}
				<input on:change={onChange} type="password" bind:value {disabled} />
			{:else if type == 'textarea'}
				<textarea on:change={onChange} class="textarea" bind:value {disabled} />
			{:else if type == 'checkbox'}
				<label>
					<input type="checkbox" bind:checked={value} {disabled} />
					{label}
				</label>
			{:else if type == 'switch'}
				<label>
					<input type="checkbox" role="switch" bind:checked={value} {disabled} />
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
