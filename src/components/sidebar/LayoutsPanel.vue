<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ConfirmModal from '@/components/ConfirmModal.vue';
import PagePreview from '@/components/page/PagePreview.vue';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import { useEditorStore } from '@/stores/editor';
import { useLayoutsStore } from '@/stores/layouts';
import { useMangaStore } from '@/stores/manga';
import type { PresetLayout } from '@/types/layouts';

const PRESET_SKELETON_COUNT = 1;

const mangaStore = useMangaStore();
const editorStore = useEditorStore();
const layoutsStore = useLayoutsStore();
const { activePage } = storeToRefs(mangaStore);
const { presets, presetsStatus, customLayouts } = storeToRefs(layoutsStore);

const pendingPreset = ref<PresetLayout | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const pageHasDrawing = computed(() => {
	return activePage.value.shapes.length > 0;
});

const presetsLoading = computed(() => {
	return presetsStatus.value === PRESETS_LOAD_STATUS.Loading;
});

onMounted(() => {
	void layoutsStore.ensurePresetsLoaded();
});

const requestApply = (preset: PresetLayout) => {
	if (pageHasDrawing.value) {
		pendingPreset.value = preset;

		return;
	}

	editorStore.applyPageLayout(preset.layout);
};

const cancelApply = () => {
	pendingPreset.value = null;
};

const confirmApply = () => {
	const preset = pendingPreset.value;

	pendingPreset.value = null;

	if (!preset) {
		return;
	}

	editorStore.applyPageLayout(preset.layout);
};

const onExportJson = () => {
	editorStore.exportPageJson();
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

	void editorStore.importPageJson(file);
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
			<ul
				v-if="presetsLoading"
				class="grid grid-cols-2 gap-2.5"
				aria-busy="true"
				aria-label="Loading presets"
			>
				<li v-for="index in PRESET_SKELETON_COUNT" :key="`preset-skeleton-${index}`">
					<div
						class="w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950"
					>
						<div
							class="aspect-3/4 w-full animate-pulse rounded-sm bg-slate-200 dark:bg-zinc-800"
						/>
					</div>
				</li>
			</ul>
			<ul v-else-if="presets.length > 0" class="grid grid-cols-2 gap-2.5">
				<li v-for="preset in presets" :key="preset.id">
					<button
						type="button"
						class="group w-full rounded-lg border border-slate-200 bg-white p-2 transition hover:border-blue-600 hover:bg-blue-50 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:focus-visible:border-blue-500"
						:aria-label="`Apply layout ${preset.id}`"
						@click="requestApply(preset)"
					>
						<span
							class="aspect-3/4 block w-full overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition group-hover:border-blue-600/50 dark:border-zinc-700 dark:bg-zinc-900 dark:group-hover:border-blue-500/50"
						>
							<PagePreview
								:width="preset.layout.width"
								:height="preset.layout.height"
								:shapes="preset.layout.shapes ?? []"
							/>
						</span>
					</button>
				</li>
			</ul>
			<p
				v-else
				class="mb-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
			>
				No layouts found.
			</p>
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
			<ul
				v-if="customLayouts.length > 0"
				class="grid grid-cols-2 gap-2.5"
			>
				<li v-for="preset in customLayouts" :key="preset.id">
					<button
						type="button"
						class="group w-full rounded-lg border border-slate-200 bg-white p-2 transition hover:border-blue-600 hover:bg-blue-50 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:focus-visible:border-blue-500"
						aria-label="Apply custom layout"
						@click="requestApply(preset)"
					>
						<span
							class="aspect-3/4 block w-full overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition group-hover:border-blue-600/50 dark:border-zinc-700 dark:bg-zinc-900 dark:group-hover:border-blue-500/50"
						>
							<PagePreview
								:width="preset.layout.width"
								:height="preset.layout.height"
								:shapes="preset.layout.shapes ?? []"
							/>
						</span>
					</button>
				</li>
			</ul>
			<p
				v-else
				class="mb-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
			>
				No custom layouts yet.
			</p>
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
				@click="onExportJson"
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
			:message="`Replace the content of '${activePage.name}'?`"
			confirm-label="Apply"
			cancel-label="Cancel"
			@confirm="confirmApply"
			@cancel="cancelApply"
		/>
	</div>
</template>
