<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { useClearActivePage } from '@/composables/page/useClearActivePage';

const { activePage } = useActivePageLayout();
const { pendingClear, requestClear, cancelClear, confirmClear } =
	useClearActivePage();

const clearMessage = computed(() => {
	return `Clear '${activePage.value.name}'? Layers reset to default and panels are removed.`;
});
</script>

<template>
	<div class="flex items-center gap-2" aria-label="Page actions">
		<button
			type="button"
			class="inline-flex size-10 items-center justify-center rounded-md border border-red-600/35 bg-red-50 text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:ring-red-600/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/35 dark:bg-red-950 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-500 dark:hover:text-white"
			aria-label="Clear page"
			title="Clear page"
			@click="requestClear"
		>
			<Icon icon="fluent:broom-24-regular" class="size-5" />
		</button>

		<ConfirmModal
			v-if="pendingClear"
			title="Clear page"
			:message="clearMessage"
			confirm-label="Clear"
			cancel-label="Cancel"
			@confirm="confirmClear"
			@cancel="cancelClear"
		/>
	</div>
</template>
