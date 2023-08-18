<script lang="ts">
	export let num: number;
	export let url: string;
</script>

<a
	href={'#'}
	on:click={() => {
		url = `/images/avatarbg/${num.toString().padStart(3, '0')}.jpg`;
	}}
>
	<img
		src={`/images/avatarbg/${num.toString().padStart(3, '0')}.jpg`}
		alt=""
		style="width:2rem;height:2rem;margin:0.2rem;"
	/>
</a>

<style>
	img {
		border-radius: 50%;
	}
</style>
