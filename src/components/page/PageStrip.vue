<script setup lang="ts">
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import PageThumb from '@/components/page/PageThumb.vue';
import ZoomControls from '@/components/toolbar/ZoomControls.vue';
import { usePageListActions } from '@/composables/page/usePageListActions';

const {
	pages,
	activePageId,
	pagesVisible,
	canRemove,
	pendingRemoveId,
	removeMessage,
	dragFromIndex,
	dropTargetIndex,
	togglePagesVisible,
	selectPage,
	addPage,
	renamePage,
	requestRemove,
	cancelRemove,
	confirmRemove,
	onDragStart,
	onDragOver,
	onDrop,
	clearDragState,
} = usePageListActions();
</script>

<template>
	<div class="flex flex-col">
		<!-- Asa del strip + zoom (fuera del stage) -->
		<div
			class="relative z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-slate-200/80 bg-slate-100/90 px-4 py-2 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/90"
		>
			<button
				type="button"
				class="col-start-2 flex h-7 w-14 shrink-0 items-center justify-center justify-self-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
				:class="{
					'border-blue-600 bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-600/40 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-500/40':
						pagesVisible,
				}"
				:aria-expanded="pagesVisible"
				aria-controls="page-strip-list"
				:aria-label="pagesVisible ? 'Hide pages' : 'Show pages'"
				:title="pagesVisible ? 'Hide pages' : 'Show pages'"
				@click="togglePagesVisible"
			>
				<Icon
					icon="fluent:chevron-down-24-regular"
					class="size-3.5 transition-transform"
					:class="{ 'rotate-180': !pagesVisible }"
				/>
			</button>

			<ZoomControls class="col-start-3 shrink-0 justify-self-end" />
		</div>

		<nav
			v-show="pagesVisible"
			id="page-strip-list"
			class="relative z-20 flex items-center gap-2.5 overflow-x-auto border-t border-slate-200/80 bg-white/95 px-4 pt-2.5 pb-3.5 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-black/95"
			aria-label="Pages"
		>
			<PageThumb
				v-for="(page, index) in pages"
				:key="page.id"
				:name="page.name"
				:index="index"
				:active="page.id === activePageId"
				:can-remove="canRemove"
				:width="page.width"
				:height="page.height"
				:shapes="page.getVisibleShapes()"
				:dragging="dragFromIndex === index"
				:drop-target="
					dropTargetIndex === index && dragFromIndex !== index
				"
				@select="selectPage(page.id)"
				@remove="requestRemove(page.id)"
				@rename="renamePage(page.id, $event)"
				@dragstart="onDragStart(index, $event)"
				@dragover="onDragOver(index, $event)"
				@drop="onDrop(index, $event)"
				@dragend="clearDragState"
			/>

			<button
				type="button"
				class="group relative flex min-w-18 shrink-0 flex-col items-center rounded-md border border-dashed border-slate-200 bg-slate-50/40 px-1.5 pt-1.5 pb-1 text-slate-500 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
				aria-label="Add page"
				@click="addPage"
			>
				<span
					class="grid h-[4.2rem] w-[4.2rem] place-items-center rounded-sm border border-dashed border-slate-200 bg-white text-lg text-inherit transition group-hover:border-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:border-blue-500"
					aria-hidden="true"
				>
					+
				</span>
				<span
					class="mx-1 mb-1 w-20 px-1.5 py-1 text-center text-sm text-inherit"
				>
					New page
				</span>
			</button>
		</nav>

		<ConfirmModal
			v-if="pendingRemoveId"
			title="Delete page"
			:message="removeMessage"
			confirm-label="Delete"
			cancel-label="Cancel"
			@confirm="confirmRemove"
			@cancel="cancelRemove"
		/>
	</div>
</template>
