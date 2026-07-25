<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useTheme } from '@/composables/useTheme';
import type { ThemePreference } from '@/types/editor';

const { preference, setPreference } = useTheme();

const options: {
	value: ThemePreference;
	label: string;
	icon: string;
}[] = [
	{ value: 'auto', label: 'Auto', icon: 'fluent:desktop-24-regular' },
	{ value: 'light', label: 'Light', icon: 'fluent:weather-sunny-24-regular' },
	{ value: 'dark', label: 'Dark', icon: 'fluent:weather-moon-24-regular' },
];
</script>

<template>
	<div
		class="flex items-center rounded-md border border-slate-200 bg-slate-50/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-950/80"
		role="group"
		aria-label="Theme"
	>
		<button
			v-for="option in options"
			:key="option.value"
			type="button"
			class="inline-flex size-9 items-center justify-center rounded transition"
			:class="
				preference === option.value
					? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
					: 'text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950 dark:hover:text-blue-400'
			"
			:aria-label="option.label"
			:aria-pressed="preference === option.value"
			:title="option.label"
			@click="setPreference(option.value)"
		>
			<Icon :icon="option.icon" class="size-5" />
		</button>
	</div>
</template>
