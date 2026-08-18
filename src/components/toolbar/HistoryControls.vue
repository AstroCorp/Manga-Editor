<script setup lang="ts">
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import { useHistoryStore } from '@/stores/history';
import { useMangaStore } from '@/stores/manga';

const mangaStore = useMangaStore();
const historyStore = useHistoryStore();
const { canUndo, canRedo, items, currentLabel } = storeToRefs(historyStore);

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const close = () => {
	open.value = false;
};

const toggleOpen = () => {
	open.value = !open.value;
};

const onSelect = (entryId: string) => {
	close();
	mangaStore.jumpToHistory(entryId);
};

onClickOutside(root, close);

const buttonClass =
	'inline-flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 aria-expanded:border-blue-600 aria-expanded:bg-blue-50 aria-expanded:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:aria-expanded:border-blue-500 dark:aria-expanded:bg-blue-950 dark:aria-expanded:text-blue-400';
</script>

<template>
	<div
		ref="root"
		class="flex items-center gap-1"
		aria-label="History"
	>
		<button
			type="button"
			:class="buttonClass"
			aria-label="Undo"
			title="Undo (Ctrl+Z)"
			:disabled="!canUndo"
			@click="mangaStore.undoHistory()"
		>
			<Icon icon="fluent:arrow-undo-24-regular" class="size-5" />
		</button>

		<div class="relative">
			<button
				type="button"
				:class="buttonClass"
				aria-label="History"
				:title="currentLabel || 'History'"
				aria-haspopup="menu"
				:aria-expanded="open"
				@click.stop="toggleOpen"
			>
				<Icon icon="fluent:history-24-regular" class="size-5" />
			</button>
			<div
				v-if="open"
				class="absolute top-[calc(100%+0.35rem)] right-0 z-50 max-h-80 min-w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-0 shadow-lg shadow-blue-600/10 dark:border-zinc-800 dark:bg-zinc-950"
				role="menu"
				aria-label="History movements"
			>
				<button
					v-for="item in items"
					:key="item.id"
					type="button"
					role="menuitem"
					class="flex w-full items-center gap-2 border-0 border-b border-slate-200 bg-transparent px-3.5 py-2.5 text-left text-sm transition last:border-b-0 focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:border-zinc-800 dark:focus-visible:bg-blue-950 dark:focus-visible:text-blue-400"
					:class="
						item.isCurrent
							? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: item.isFuture
								? 'text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-zinc-900 dark:hover:text-slate-200'
								: 'text-slate-900 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-100 dark:hover:bg-blue-950 dark:hover:text-blue-400'
					"
					:aria-current="item.isCurrent ? 'step' : undefined"
					:title="item.label"
					@click="onSelect(item.id)"
				>
					<span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
					<Icon
						v-if="item.isCurrent"
						icon="fluent:checkmark-16-regular"
						class="size-4 shrink-0"
						aria-hidden="true"
					/>
				</button>
			</div>
		</div>

		<button
			type="button"
			:class="buttonClass"
			aria-label="Redo"
			title="Redo (Ctrl+Y)"
			:disabled="!canRedo"
			@click="mangaStore.redoHistory()"
		>
			<Icon icon="fluent:arrow-redo-24-regular" class="size-5" />
		</button>
	</div>
</template>
