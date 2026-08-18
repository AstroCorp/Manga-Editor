<script setup lang="ts">
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { useEditorStore } from '@/stores/editor';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import type { ExportImageFormat } from '@/types/editor';

const editorStore = useEditorStore();

const downloadOpen = ref(false);
const isExporting = ref(false);
const downloadRoot = ref<HTMLElement | null>(null);

const closeDownload = () => {
	downloadOpen.value = false;
};

const toggleDownload = () => {
	if (isExporting.value) {
		return;
	}

	downloadOpen.value = !downloadOpen.value;
};

const onExportImage = (format: ExportImageFormat) => {
	closeDownload();
	editorStore.exportPage(format);
};

const onExportZip = async (format: ExportImageFormat) => {
	closeDownload();

	if (isExporting.value) {
		return;
	}

	isExporting.value = true;

	try {
		await editorStore.exportPagesZip(format);
	} finally {
		isExporting.value = false;
	}
};

onClickOutside(downloadRoot, closeDownload);

const menuItemClass =
	'w-full whitespace-nowrap border-0 border-b border-slate-200 bg-transparent px-3.5 py-2.5 text-left text-sm text-slate-900 transition last:border-b-0 hover:bg-blue-50 hover:text-blue-600 focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:border-zinc-800 dark:text-slate-100 dark:hover:bg-blue-950 dark:hover:text-blue-400';
</script>

<template>
	<div ref="downloadRoot" class="relative">
		<button
			type="button"
			class="inline-flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 aria-expanded:border-blue-600 aria-expanded:bg-blue-50 aria-expanded:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:aria-expanded:border-blue-500 dark:aria-expanded:bg-blue-950 dark:aria-expanded:text-blue-400"
			aria-label="Download"
			title="Download"
			aria-haspopup="menu"
			:aria-expanded="downloadOpen"
			:aria-busy="isExporting"
			:disabled="isExporting"
			@click.stop="toggleDownload"
		>
			<Icon icon="fluent:arrow-download-24-regular" class="size-5" />
		</button>
		<div
			v-if="downloadOpen"
			class="absolute top-[calc(100%+0.35rem)] right-0 z-50 flex min-w-56 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-lg shadow-blue-600/10 dark:border-zinc-800 dark:bg-zinc-950"
			role="menu"
			aria-label="Download formats"
		>
			<button
				type="button"
				role="menuitem"
				:class="menuItemClass"
				@click="onExportImage(EXPORT_IMAGE_FORMAT.Png)"
			>
				PNG (current page)
			</button>
			<button
				type="button"
				role="menuitem"
				:class="menuItemClass"
				@click="onExportImage(EXPORT_IMAGE_FORMAT.Jpeg)"
			>
				JPG (current page)
			</button>
			<button
				type="button"
				role="menuitem"
				:class="menuItemClass"
				@click="onExportZip(EXPORT_IMAGE_FORMAT.Png)"
			>
				ZIP with PNGs (all pages)
			</button>
			<button
				type="button"
				role="menuitem"
				:class="menuItemClass"
				@click="onExportZip(EXPORT_IMAGE_FORMAT.Jpeg)"
			>
				ZIP with JPGs (all pages)
			</button>
		</div>
	</div>
</template>
