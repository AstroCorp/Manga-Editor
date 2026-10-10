<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMangaStore } from '@/stores/manga';

const mangaStore = useMangaStore();
const { title } = storeToRefs(mangaStore);
const draft = ref(title.value);
const focused = ref(false);

watch(title, (value) => {
	if (!focused.value) {
		draft.value = value;
	}
});

const commit = () => {
	const next = draft.value.trim();

	if (!next) {
		draft.value = title.value;

		return;
	}

	mangaStore.setTitle(next);
	draft.value = title.value;
};

const onFocus = () => {
	focused.value = true;
};

const onBlur = () => {
	focused.value = false;
	commit();
};

const onKeydown = (event: KeyboardEvent) => {
	if (event.key !== 'Enter') {
		return;
	}

	event.preventDefault();
	focused.value = false;
	commit();
	(event.target as HTMLInputElement).blur();
};
</script>

<template>
	<input
		v-model="draft"
		class="h-10 w-44 max-w-[40vw] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
		type="text"
		maxlength="80"
		spellcheck="false"
		aria-label="Project name"
		title="Project name"
		@focus="onFocus"
		@blur="onBlur"
		@keydown="onKeydown"
	/>
</template>
