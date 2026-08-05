<script setup lang="ts">
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import LayerListItem from '@/components/sidebar/LayerListItem.vue';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { useLayersPanelActions } from '@/composables/page/useLayersPanelActions';

const { pageSize } = useActivePageLayout();

const {
	displayLayers,
	activeLayer,
	pendingRemoveId,
	removeMessage,
	canRemove,
	dragFromVisualIndex,
	dropTargetVisualIndex,
	selectLayer,
	addLayer,
	requestRemove,
	cancelRemove,
	confirmRemove,
	toggleVisible,
	renameLayer,
	onDragStart,
	onDragOver,
	onDrop,
	clearDragState,
} = useLayersPanelActions();
</script>

<template>
	<div class="flex flex-col px-4 pb-6" aria-label="Layers">
		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<div class="flex items-center justify-between gap-2">
				<h3
					class="mb-0 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
				>
					Stack
				</h3>
				<button
					type="button"
					class="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600/50 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-950 dark:hover:text-blue-400"
					aria-label="Add layer"
					title="Add layer"
					@click="addLayer"
				>
					<Icon icon="fluent:add-24-regular" class="size-4" />
				</button>
			</div>

			<p class="text-xs text-slate-500 dark:text-slate-400">
				Drag to reorder. Top of the list draws on top.
			</p>

			<ul class="flex flex-col gap-1.5" aria-label="Layer list">
				<LayerListItem
					v-for="(layer, visualIndex) in displayLayers"
					:key="layer.id"
					:name="layer.name"
					:active="layer.id === activeLayer.id"
					:visible="layer.visible"
					:can-remove="canRemove"
					:width="pageSize.width"
					:height="pageSize.height"
					:shapes="layer.shapes"
					:dragging="dragFromVisualIndex === visualIndex"
					:drop-target="dropTargetVisualIndex === visualIndex"
					@select="selectLayer(layer.id)"
					@remove="requestRemove(layer.id)"
					@rename="renameLayer(layer.id, $event)"
					@toggle-visible="toggleVisible(layer.id)"
					@dragstart="onDragStart(visualIndex, $event)"
					@dragover="onDragOver(visualIndex, $event)"
					@drop="onDrop(visualIndex, $event)"
					@dragend="clearDragState"
				/>
			</ul>
		</section>

		<ConfirmModal
			v-if="pendingRemoveId"
			title="Delete layer"
			:message="removeMessage"
			confirm-label="Delete"
			cancel-label="Cancel"
			@confirm="confirmRemove"
			@cancel="cancelRemove"
		/>
	</div>
</template>
