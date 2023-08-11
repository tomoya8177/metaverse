<script lang="ts">
	import { PreviewPanelOpen, ItemsInPreview } from '$lib/store';
	import { _ } from '$lib/i18n';
	import Icon from '../Atom/Icon.svelte';
</script>

<div class="filePreviewContainer" class:hidden={!$PreviewPanelOpen}>
	<div style="display:flex">
		<div style="flex:1">
			{_('Preview Panel')}
		</div>
		<div>
			<a
				href={'#'}
				on:click={() => {
					PreviewPanelOpen.set(false);
				}}
			>
				<Icon icon="close" />
			</a>
		</div>
	</div>
	<ul id="filePreview">
		{#each $ItemsInPreview.filter((item) => item.shortType == 'screen') as object}
			<li class="previewPaneItem" id={object.id + '_preview'}>
				<div class="content" />
			</li>
		{/each}
		{#each $ItemsInPreview.filter((item) => item.shortType != 'screen') as object}
			<li class="previewPaneItem" id={object.id + '_preview'}>
				{#if object.title}
					<div style="position:absolute; top:0px;right:0px;z-index:2;">
						<a href={object.url} target="_blank">
							{object.title}
							<Icon icon="open_in_new" />
						</a>
						<a
							href={'#'}
							on:click={() => {
								object.inPreviewPane = false;
								ItemsInPreview.update((items) => {
									console.log({ items });
									return items.filter((item) => item.inPreviewPane);
								});
							}}
						>
							<Icon icon="close" />
						</a>
					</div>
				{/if}
				<div class="content">
					{#if object.shortType == 'image'}
						<img src={object.url} alt={object.title} />
					{:else if object.shortType == 'video'}
						<video src={object.url} controls muted />
					{:else if object.shortType == 'screen'}
						<!--none-->
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.hidden {
		display: none;
	}

	#filePreview {
		overflow: auto;
		display: flex;
		flex-wrap: nowrap;
		list-style-type: none;
		gap: 0.2rem;
		height: 100%;
		margin-bottom: 0px;
	}
	.previewPaneItem {
		/* min-width: calc(100vw - 6rem); */
		height: calc(100svh - 11rem);
		border-radius: 0.2rem;
		flex: none;
		position: relative;
		list-style: none;
		margin-bottom: 0px;
	}
	.filePreviewContainer {
		position: absolute;
		top: 3rem;
		left: 1rem;
		right: 1rem;
		background-color: black;
		padding: 0.4rem;
		border-radius: 0.4rem;
	}

	#myCameraPreview {
		position: absolute;
		bottom: 6rem;
		right: 1rem;
		border-radius: 50%;
		overflow: hidden;
		box-shadow: 0 0 0.4rem 0.4rem rgba(0, 0, 0, 0.2);
	}
</style>
