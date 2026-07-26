<script setup lang="ts">
import { computed } from 'vue';
import { formatGridLineDelta } from '@/composables/panel/useGridPointHover';
import type { GridPointLabelProps } from '@/types/panel';

const props = defineProps<GridPointLabelProps>();

const label = computed(() => {
	return props.delta ? formatGridLineDelta(props.delta) : '';
});

const style = computed(() => {
	if (props.left === null || props.top === null || !props.delta) {
		return null;
	}

	return {
		left: `${props.left}px`,
		top: `${props.top}px`,
	};
});
</script>

<template>
	<div
		v-if="label && style"
		class="pointer-events-none absolute z-20 -translate-y-full rounded bg-slate-900/85 px-2 py-1 font-mono text-sm leading-none text-white shadow-sm dark:bg-zinc-100/90 dark:text-zinc-900"
		:style="style"
		aria-hidden="true"
	>
		{{ label }}
	</div>
</template>
