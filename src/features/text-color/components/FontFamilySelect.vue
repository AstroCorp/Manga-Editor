<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import FontFamilyOption from '@/features/text-color/components/FontFamilyOption.vue';
import { useFavoriteFonts } from '@/composables/fonts/useFavoriteFonts';
import { useScrollPagedSlice } from '@/composables/ui/useScrollPagedSlice';
import { fontsInUse } from '@/lib/fonts/documentFonts';
import { pinnedFavoriteFonts } from '@/lib/fonts/favoriteFonts';
import { getEditorFontCatalog } from '@/lib/fonts/googleFontsCatalog';
import type { EditorFontFamily } from '@/types/fonts';

const MIXED_VALUE_LABEL = 'mix';
const PAGE_SIZE = 20;

const props = withDefaults(
	defineProps<{
		modelValue: string | null;
		dominantFontFamily: string;
		/** Familias usadas en el documento (todas las páginas); sección "In use". */
		usedFontFamilies?: readonly string[];
	}>(),
	{
		usedFontFamilies: () => [],
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const open = ref(false);
const loading = ref(false);
const query = ref('');
const catalog = shallowRef<EditorFontFamily[]>([]);
const failedPreviewIds = shallowRef(new Set<string>());
const loadedPreviewIds = shallowRef(new Set<string>());
const { favoriteFontIds, isFavorite, toggleFavorite } = useFavoriteFonts();

const isSearching = computed(() => {
	return query.value.trim().length > 0;
});

const filteredCatalog = computed(() => {
	const needle = query.value.trim().toLowerCase();

	if (!needle) {
		return catalog.value;
	}

	return catalog.value.filter((font) => {
		return font.family.toLowerCase().includes(needle);
	});
});

/** Solo sin búsqueda: al buscar, las favoritas se ven marcadas en el listado normal. */
const pinnedFavorites = computed(() => {
	if (isSearching.value) {
		return [];
	}

	return pinnedFavoriteFonts(catalog.value, favoriteFontIds.value);
});

const usedFonts = computed(() => {
	if (isSearching.value) {
		return [];
	}

	return fontsInUse(catalog.value, props.usedFontFamilies);
});

const { scrollEl, visibleItems } = useScrollPagedSlice(filteredCatalog, {
	initial: PAGE_SIZE,
	pageSize: PAGE_SIZE,
});

const displayLabel = computed(() => {
	return props.modelValue === null ? MIXED_VALUE_LABEL : props.modelValue;
});

onClickOutside(root, () => {
	if (!open.value) {
		return;
	}

	open.value = false;
	query.value = '';
});

const loadCatalog = async () => {
	if (catalog.value.length > 0) {
		return;
	}

	loading.value = true;

	try {
		catalog.value = await getEditorFontCatalog();
	} finally {
		loading.value = false;
	}
};

const toggleOpen = async () => {
	open.value = !open.value;

	if (!open.value) {
		query.value = '';

		return;
	}

	await loadCatalog();
	await nextTick();
	searchInput.value?.focus();
};

const close = () => {
	open.value = false;
	query.value = '';
	trigger.value?.focus({ preventScroll: true });
};

const selectFamily = (family: string) => {
	emit('update:modelValue', family);
	close();
};

const isPreviewLoaded = (fontId: string) => {
	return loadedPreviewIds.value.has(fontId);
};

const markPreviewLoaded = (fontId: string) => {
	if (loadedPreviewIds.value.has(fontId)) {
		return;
	}

	const next = new Set(loadedPreviewIds.value);
	next.add(fontId);
	loadedPreviewIds.value = next;
};

const onPreviewError = (fontId: string) => {
	const next = new Set(failedPreviewIds.value);
	next.add(fontId);
	failedPreviewIds.value = next;
};
</script>

<template>
	<div ref="root" class="relative">
		<button
			ref="trigger"
			type="button"
			class="inline-flex h-9 max-w-28 items-center gap-1 rounded-md px-1.5 text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			title="Font family"
			aria-label="Font family"
			aria-haspopup="listbox"
			:aria-expanded="open"
			@click="toggleOpen"
		>
			<span
				class="truncate text-xs whitespace-nowrap"
				:style="
					modelValue
						? { fontFamily: modelValue }
						: { fontFamily: dominantFontFamily }
				"
			>
				{{ displayLabel }}
			</span>
			<Icon
				icon="fluent:chevron-down-16-regular"
				class="size-3.5 shrink-0 opacity-70"
				aria-hidden="true"
			/>
		</button>

		<div
			v-if="open"
			class="absolute top-full left-0 z-40 mt-1 min-w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/15 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-black/40"
		>
			<div
				class="border-b border-slate-200 p-1.5 dark:border-zinc-700"
			>
				<input
					ref="searchInput"
					v-model="query"
					type="search"
					class="h-7 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
					placeholder="Search fonts…"
					aria-label="Search fonts"
					autocomplete="off"
					spellcheck="false"
					@keydown.escape.prevent="close"
				/>
			</div>

			<ul
				ref="scrollEl"
				class="max-h-72 overflow-y-auto py-1"
				role="listbox"
				aria-label="Font family options"
			>
				<li v-if="loading" class="px-2.5 py-2 text-xs text-slate-500">
					Loading…
				</li>
				<li
					v-else-if="filteredCatalog.length === 0"
					class="px-2.5 py-2 text-xs text-slate-500"
				>
					No fonts found
				</li>
				<template v-if="!loading && pinnedFavorites.length > 0">
					<li
						role="presentation"
						class="px-2.5 pt-1 pb-0.5 text-[10px] font-semibold tracking-[0.08em] text-slate-400 uppercase dark:text-slate-500"
						data-testid="favorite-fonts-heading"
					>
						Favorites
					</li>
					<FontFamilyOption
						v-for="font in pinnedFavorites"
						:key="`favorite-${font.id}`"
						:font="font"
						:selected="font.family === modelValue"
						favorite
						:preview-loaded="isPreviewLoaded(font.id)"
						:preview-failed="failedPreviewIds.has(font.id)"
						data-testid="favorite-font-option"
						@select="selectFamily"
						@toggle-favorite="toggleFavorite"
						@preview-load="markPreviewLoaded"
						@preview-error="onPreviewError"
					/>
					<li
						role="presentation"
						class="mx-2.5 my-1 border-t border-slate-200 dark:border-zinc-700"
						aria-hidden="true"
					/>
				</template>
				<template v-if="!loading && usedFonts.length > 0">
					<li
						role="presentation"
						class="px-2.5 pt-1 pb-0.5 text-[10px] font-semibold tracking-[0.08em] text-slate-400 uppercase dark:text-slate-500"
						data-testid="used-fonts-heading"
					>
						In use
					</li>
					<FontFamilyOption
						v-for="font in usedFonts"
						:key="`used-${font.id}`"
						:font="font"
						:selected="font.family === modelValue"
						:favorite="isFavorite(font.id)"
						:preview-loaded="isPreviewLoaded(font.id)"
						:preview-failed="failedPreviewIds.has(font.id)"
						data-testid="used-font-option"
						@select="selectFamily"
						@toggle-favorite="toggleFavorite"
						@preview-load="markPreviewLoaded"
						@preview-error="onPreviewError"
					/>
					<li
						role="presentation"
						class="mx-2.5 my-1 border-t border-slate-200 dark:border-zinc-700"
						aria-hidden="true"
					/>
				</template>
				<FontFamilyOption
					v-for="font in visibleItems"
					:key="font.id"
					:font="font"
					:selected="font.family === modelValue"
					:favorite="isFavorite(font.id)"
					:preview-loaded="isPreviewLoaded(font.id)"
					:preview-failed="failedPreviewIds.has(font.id)"
					@select="selectFamily"
					@toggle-favorite="toggleFavorite"
					@preview-load="markPreviewLoaded"
					@preview-error="onPreviewError"
				/>
			</ul>
		</div>
	</div>
</template>
