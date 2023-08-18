<script lang="ts">
	import type { SharedObject } from '$lib/frontend/Classes/SharedObject';
	import { ClockPositions } from '$lib/preset/ClockPositions';
	import axios from 'axios';

	import { toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { InputWithLabel } from 'mymetaverseportal-ui-component';
	export let object: SharedObject;
	export let onUpdate: (value: number) => void = (value) => {};
	export let readonly: boolean = false;
</script>

<InputWithLabel
	disabled={readonly}
	type="select"
	selects={ClockPositions}
	bind:value={object.lockedPosition}
	onChange={async () => {
		console.log({ object });
		const updatedData = await axios.put(`/api/objects/${object.id}`, {
			lockedPosition: object.lockedPosition
		});
		console.log({ updatedData });
		toast(_(`Updated`));
		onUpdate(object.lockedPosition);
	}}
/>
