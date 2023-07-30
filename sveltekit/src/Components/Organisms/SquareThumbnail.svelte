<script lang="ts">
	export let url: string;
	export let size: string = '3rem';
	export let radius: string = '0.2rem';
</script>

<span
	style="width:{size};height:{size};display:inline-block;overflow:hidden;border-radius:{radius}"
>
	<img style="min-height:{size};min-width:{size}" src={url} alt="" />
</span>
