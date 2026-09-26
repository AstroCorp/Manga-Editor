<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { EditorFontFamily } from '@/types/fonts';

defineProps<{
	font: EditorFontFamily;
	selected: boolean;
	favorite: boolean;
	previewLoaded: boolean;
	previewFailed: boolean;
}>();

const emit = defineEmits<{
	select: [family: string];
	toggleFavorite: [fontId: string];
	previewLoad: [fontId: string];
	previewError: [fontId: string];
}>();
</script>

<template>
	<li role="option" :aria-selected="selected">
		<div
			class="flex h-11 items-center pr-1 transition"
			:class="
				selected
					? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
					: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-zinc-800'
			"
		>
			<button
				type="button"
				class="flex h-full min-w-0 flex-1 items-center px-2.5 text-left text-xs"
				:title="font.family"
				@click="emit('select', font.family)"
			>
				<span
					v-if="Boolean(font.previewUrl) && !previewFailed"
					class="relative flex h-7 w-full items-center"
				>
					<span
						v-if="!previewLoaded"
						class="absolute inset-y-0 left-0 my-auto h-4 w-32 max-w-[70%] animate-pulse rounded bg-slate-200 dark:bg-zinc-800"
						aria-hidden="true"
					/>
					<img
						:src="font.previewUrl"
						:alt="font.family"
						class="h-7 max-w-full object-contain object-left transition-opacity duration-150 dark:invert"
						:class="previewLoaded ? 'opacity-100' : 'opacity-0'"
						loading="lazy"
						decoding="async"
						@load="emit('previewLoad', font.id)"
						@error="emit('previewError', font.id)"
					/>
				</span>
				<span
					v-else
					class="truncate text-sm whitespace-nowrap"
					:style="{ fontFamily: font.family }"
				>
					{{ font.family }}
				</span>
			</button>
			<button
				type="button"
				class="inline-flex size-7 shrink-0 items-center justify-center rounded-md transition"
				:class="
					favorite
						? 'text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/60'
						: 'text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-zinc-700 dark:hover:text-slate-300'
				"
				:aria-label="
					favorite
						? `Remove ${font.family} from favorites`
						: `Add ${font.family} to favorites`
				"
				:title="favorite ? 'Remove from favorites' : 'Add to favorites'"
				:aria-pressed="favorite"
				@click.stop="emit('toggleFavorite', font.id)"
			>
				<Icon
					:icon="
						favorite ? 'fluent:star-24-filled' : 'fluent:star-24-regular'
					"
					class="size-4"
					aria-hidden="true"
				/>
			</button>
		</div>
	</li>
</template>
