<script lang="ts">
	export let onClick: () => void;
</script>

<a href={'#'} on:click={onClick} aria-label="Close" class="close" />
