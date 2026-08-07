<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { MasonryWall } from '@yeger/vue-masonry-wall';
import ConfirmModal from '@/components/ConfirmModal.vue';
import PagePreview from '@/components/page/PagePreview.vue';
import LayoutThumbSkeleton from '@/components/sidebar/LayoutThumbSkeleton.vue';
import { useLayoutsPanelActions } from '@/composables/layouts/useLayoutsPanelActions';
import { useScrollPagedSlice } from '@/composables/ui/useScrollPagedSlice';
import { layoutPreviewShapes } from '@/lib/page/layoutPreviewShapes';
import {
	isMultiLayerLayout,
	layoutLayerCount,
} from '@/lib/page/resolveLayoutFields';
import type { PresetLayout } from '@/types/layouts';

const PRESET_SKELETON_COUNT = 6;
const LAYOUT_PAGE_SIZE = 6;
/** ~2 columnas en el panel w-72 (contenido ~256px, gap 10). */
const MASONRY_COLUMN_WIDTH = 120;
const MASONRY_GAP = 10;

const {
	presets,
	customLayouts,
	presetsLoading,
	presetsLoadingMore,
	hasMorePresets,
	presetsScrollEl,
	presetsSentinelEl,
	notifyPresetsLayoutReady,
	pendingPreset,
	pendingDeleteCustom,
	applyMessage,
	loadPresets,
	requestApply,
	cancelApply,
	confirmApply,
	requestDeleteCustom,
	cancelDeleteCustom,
	confirmDeleteCustom,
	exportJson,
	importJson,
} = useLayoutsPanelActions();

const {
	scrollEl: customScrollEl,
	sentinelEl: customSentinelEl,
	visibleItems: visibleCustomLayouts,
	hasMore: hasMoreCustom,
	isLoadingMore: isLoadingMoreCustom,
	notifyLayoutReady: notifyCustomLayoutReady,
} = useScrollPagedSlice(customLayouts, {
	initial: LAYOUT_PAGE_SIZE,
	pageSize: LAYOUT_PAGE_SIZE,
	loadWhenNarrow: false,
	waitForLayoutReady: true,
});

const fileInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
	void loadPresets();
});

const layoutKey = (item: PresetLayout) => {
	return item.id;
};

const previewAspectStyle = (preset: PresetLayout) => {
	return {
		aspectRatio: `${preset.layout.width} / ${preset.layout.height}`,
	};
};

const onImportClick = () => {
	fileInput.value?.click();
};

const onFileChange = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];

	input.value = '';

	if (!file) {
		return;
	}

	importJson(file);
};
</script>

<template>
	<div class="flex flex-col px-4 pb-6" aria-label="Layouts">
		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Presets
			</h3>
			<p
				class="mb-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
			>
				Apply a built-in layout to the active page.
			</p>
			<div
				ref="presetsScrollEl"
				class="h-87.5 overflow-y-auto pe-0.5"
			>
				<ul
					v-if="presetsLoading"
					class="grid grid-cols-2 gap-2.5"
					aria-busy="true"
					aria-label="Loading presets"
				>
					<li v-for="index in PRESET_SKELETON_COUNT" :key="`preset-skeleton-${index}`">
						<LayoutThumbSkeleton />
					</li>
				</ul>
				<template v-else-if="presets.length > 0">
					<MasonryWall
						:items="presets"
						:column-width="MASONRY_COLUMN_WIDTH"
						:gap="MASONRY_GAP"
						:min-columns="2"
						:max-columns="2"
						:key-mapper="layoutKey"
						:aria-busy="presetsLoadingMore || undefined"
						@redraw="notifyPresetsLayoutReady"
					>
						<template #default="{ item: preset }">
							<button
								type="button"
								class="group relative w-full rounded-lg border border-slate-200 bg-white p-2 transition hover:border-blue-600 hover:bg-blue-50 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:focus-visible:border-blue-500"
								:aria-label="
									isMultiLayerLayout(preset.layout)
										? `Apply multi-layer layout ${preset.id}`
										: `Apply layout ${preset.id}`
								"
								@click="requestApply(preset)"
							>
								<span
									class="block w-full overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition group-hover:border-blue-600/50 dark:border-zinc-700 dark:bg-zinc-900 dark:group-hover:border-blue-500/50"
									:style="previewAspectStyle(preset)"
								>
									<PagePreview
										:width="preset.layout.width"
										:height="preset.layout.height"
										:shapes="layoutPreviewShapes(preset.layout)"
									/>
								</span>
								<span
									v-if="isMultiLayerLayout(preset.layout)"
									class="absolute bottom-2.5 left-2.5 inline-flex items-center gap-0.5 rounded bg-black/55 px-1 py-0.5 text-[0.65rem] leading-none font-medium text-white"
									title="Multi-layer layout"
								>
									<Icon
										icon="fluent:layer-24-regular"
										class="size-3 shrink-0"
										aria-hidden="true"
									/>
									{{ layoutLayerCount(preset.layout) }}
								</span>
							</button>
						</template>
					</MasonryWall>
					<div
						ref="presetsSentinelEl"
						class="h-px w-full"
						aria-hidden="true"
					/>
					<ul
						v-if="presetsLoadingMore"
						class="mt-2.5 grid grid-cols-2 gap-2.5"
						aria-hidden="true"
					>
						<li
							v-for="index in LAYOUT_PAGE_SIZE"
							:key="`preset-more-${index}`"
						>
							<LayoutThumbSkeleton />
						</li>
					</ul>
				</template>
				<p
					v-else
					class="mb-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
				>
					No layouts found.
				</p>
				<p
					v-if="!presetsLoading && hasMorePresets && !presetsLoadingMore"
					class="mt-2 text-center text-xs text-slate-400 dark:text-slate-500"
					aria-hidden="true"
				>
					Scroll for more
				</p>
			</div>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Custom
			</h3>
			<p
				class="mb-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
			>
				Layouts saved from Import JSON (stored in this browser).
			</p>
			<div
				ref="customScrollEl"
				class="h-87.5 overflow-y-auto pe-0.5"
			>
				<template v-if="customLayouts.length > 0">
					<MasonryWall
						:items="visibleCustomLayouts"
						:column-width="MASONRY_COLUMN_WIDTH"
						:gap="MASONRY_GAP"
						:min-columns="2"
						:max-columns="2"
						:key-mapper="layoutKey"
						:aria-busy="isLoadingMoreCustom || undefined"
						@redraw="notifyCustomLayoutReady"
					>
						<template #default="{ item: preset }">
							<div class="group relative">
								<button
									type="button"
									class="relative w-full rounded-lg border border-slate-200 bg-white p-2 transition hover:border-blue-600 hover:bg-blue-50 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:focus-visible:border-blue-500"
									:aria-label="
										isMultiLayerLayout(preset.layout)
											? 'Apply multi-layer custom layout'
											: 'Apply custom layout'
									"
									@click="requestApply(preset)"
								>
									<span
										class="block w-full overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition group-hover:border-blue-600/50 dark:border-zinc-700 dark:bg-zinc-900 dark:group-hover:border-blue-500/50"
										:style="previewAspectStyle(preset)"
									>
										<PagePreview
											:width="preset.layout.width"
											:height="preset.layout.height"
											:shapes="layoutPreviewShapes(preset.layout)"
										/>
									</span>
									<span
										v-if="isMultiLayerLayout(preset.layout)"
										class="absolute bottom-2.5 left-2.5 inline-flex items-center gap-0.5 rounded bg-black/55 px-1 py-0.5 text-[0.65rem] leading-none font-medium text-white"
										title="Multi-layer layout"
									>
										<Icon
											icon="fluent:layer-24-regular"
											class="size-3 shrink-0"
											aria-hidden="true"
										/>
										{{ layoutLayerCount(preset.layout) }}
									</span>
								</button>
								<button
									type="button"
									class="absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-md border border-red-600/35 bg-white/95 text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:border-red-600 focus-visible:opacity-100 dark:border-red-500/35 dark:bg-zinc-950/95 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-500 dark:hover:text-white"
									aria-label="Delete custom layout"
									title="Delete custom layout"
									@click.stop="requestDeleteCustom(preset)"
								>
									<Icon icon="fluent:delete-24-regular" class="size-5" />
								</button>
							</div>
						</template>
					</MasonryWall>
					<div
						ref="customSentinelEl"
						class="h-px w-full"
						aria-hidden="true"
					/>
					<ul
						v-if="isLoadingMoreCustom"
						class="mt-2.5 grid grid-cols-2 gap-2.5"
						aria-hidden="true"
					>
						<li
							v-for="index in LAYOUT_PAGE_SIZE"
							:key="`custom-more-${index}`"
						>
							<LayoutThumbSkeleton />
						</li>
					</ul>
				</template>
				<p
					v-else
					class="mb-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
				>
					No custom layouts yet.
				</p>
				<p
					v-if="hasMoreCustom && !isLoadingMoreCustom"
					class="mt-2 text-center text-xs text-slate-400 dark:text-slate-500"
					aria-hidden="true"
				>
					Scroll for more
				</p>
			</div>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Page JSON
			</h3>
			<p
				class="mb-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
			>
				Export the current page, or import JSON to apply it and save it
				under Custom.
			</p>
			<button
				type="button"
				class="inline-flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:focus-visible:border-blue-500"
				@click="exportJson"
			>
				Export JSON
			</button>
			<button
				type="button"
				class="inline-flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:focus-visible:border-blue-500"
				@click="onImportClick"
			>
				Import JSON
			</button>
			<input
				ref="fileInput"
				type="file"
				accept="application/json,.json"
				hidden
				@change="onFileChange"
			/>
		</section>

		<ConfirmModal
			v-if="pendingPreset"
			title="Apply layout"
			:message="applyMessage"
			confirm-label="Apply"
			cancel-label="Cancel"
			@confirm="confirmApply"
			@cancel="cancelApply"
		/>
		<ConfirmModal
			v-if="pendingDeleteCustom"
			title="Delete custom layout"
			message="Remove this layout from Custom? This cannot be undone."
			confirm-label="Delete"
			cancel-label="Cancel"
			@confirm="confirmDeleteCustom"
			@cancel="cancelDeleteCustom"
		/>
	</div>
</template>
