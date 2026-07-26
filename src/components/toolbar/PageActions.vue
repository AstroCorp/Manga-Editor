<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

const mangaStore = useMangaStore();
const editorStore = useEditorStore();
const { activePage } = useActivePageLayout();

const pendingClear = ref(false);

const requestClearPage = () => {
	pendingClear.value = true;
};

const cancelClearPage = () => {
	pendingClear.value = false;
};

const confirmClearPage = () => {
	pendingClear.value = false;
	editorStore.cancelStroke();
	mangaStore.clearActivePage();
};
</script>

<template>
	<div class="flex items-center gap-2" aria-label="Page actions">
		<button
			type="button"
			class="inline-flex size-10 items-center justify-center rounded-md border border-red-600/35 bg-red-50 text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:ring-red-600/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/35 dark:bg-red-950 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-500 dark:hover:text-white"
			aria-label="Clear page"
			title="Clear page"
			@click="requestClearPage"
		>
			<Icon icon="fluent:broom-24-regular" class="size-5" />
		</button>

		<ConfirmModal
			v-if="pendingClear"
			title="Clear page"
			:message="`Clear '${activePage.name}'? Panels will be removed.`"
			confirm-label="Clear"
			cancel-label="Cancel"
			@confirm="confirmClearPage"
			@cancel="cancelClearPage"
		/>
	</div>
</template>
