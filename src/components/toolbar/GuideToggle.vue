<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();
const { showGridGuides } = storeToRefs(editorStore);
</script>

<template>
	<button
		type="button"
		class="relative inline-flex h-10 w-10 items-center justify-center rounded-md border transition focus-visible:border-blue-600 dark:focus-visible:border-blue-500"
		:class="
			showGridGuides
				? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-600/90 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500/90'
				: 'border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400'
		"
		:aria-label="showGridGuides ? 'Hide guides' : 'Show guides'"
		:title="showGridGuides ? 'Hide guides' : 'Show guides'"
		:aria-pressed="showGridGuides"
		@click="editorStore.toggleGridGuides()"
	>
		<Icon
			icon="fluent:grid-dots-24-regular"
			class="size-6 -translate-x-px"
		/>
		<span
			class="absolute right-1 bottom-1 grid size-4.5 place-items-center rounded-sm bg-white/90 text-slate-700 shadow-sm"
			aria-hidden="true"
		>
			<Icon
				:icon="
					showGridGuides
						? 'fluent:eye-24-regular'
						: 'fluent:eye-off-24-regular'
				"
				class="size-3.5"
			/>
		</span>
	</button>
</template>
