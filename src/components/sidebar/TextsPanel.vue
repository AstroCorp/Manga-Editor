<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();

const addSimpleText = () => {
	editorStore.addSimpleText();
};

const addBoxedText = () => {
	editorStore.addBoxedText();
};

const addRoundedBoxedText = () => {
	editorStore.addRoundedBoxedText();
};
</script>

<template>
	<div class="flex flex-col px-4 pb-6" aria-label="Texts">
		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Types
			</h3>
			<button
				type="button"
				class="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-600 hover:bg-blue-50 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500/25"
				aria-label="Add simple text"
				@click="addSimpleText"
			>
				<span
					class="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200"
				>
					<Icon icon="fluent:text-t-24-regular" class="size-5" />
				</span>
				<span
					class="text-sm font-medium text-slate-900 dark:text-slate-100"
				>
					Simple text
				</span>
			</button>
			<button
				type="button"
				class="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-600 hover:bg-blue-50 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500/25"
				aria-label="Add boxed text"
				@click="addBoxedText"
			>
				<span
					class="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200"
				>
					<Icon
						icon="fluent:textbox-align-bottom-24-regular"
						class="size-5"
					/>
				</span>
				<span
					class="text-sm font-medium text-slate-900 dark:text-slate-100"
				>
					Boxed text
				</span>
			</button>
			<button
				type="button"
				class="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-600 hover:bg-blue-50 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500/25"
				aria-label="Add rounded boxed text"
				@click="addRoundedBoxedText"
			>
				<span
					class="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200"
				>
					<Icon icon="fluent:oval-24-regular" class="size-5" />
				</span>
				<span
					class="text-sm font-medium text-slate-900 dark:text-slate-100"
				>
					Rounded boxed text
				</span>
			</button>
		</section>
	</div>
</template>
