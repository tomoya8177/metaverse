<script lang="ts">
	export let onClick: () => void;
	export let testId: string = '';
</script>

<a href={'#'} data-testid={testId} on:click={onClick} aria-label="Close" class="close" />
