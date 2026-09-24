<script setup lang="ts">
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useNewProject } from '@/composables/page/useNewProject';

const { pendingNewProject, requestNewProject, cancelNewProject, confirmNewProject } =
	useNewProject();
</script>

<template>
	<div class="flex items-center" aria-label="Project actions">
		<button
			type="button"
			class="inline-flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			aria-label="New project"
			title="New project"
			@click="requestNewProject"
		>
			<Icon icon="fluent:document-add-24-regular" class="size-5" />
		</button>

		<ConfirmModal
			v-if="pendingNewProject"
			title="New project"
			message="This will replace all pages with a blank Page 1 and clear saved images and history."
			confirm-label="New project"
			cancel-label="Cancel"
			@confirm="confirmNewProject"
			@cancel="cancelNewProject"
		/>
	</div>
</template>
