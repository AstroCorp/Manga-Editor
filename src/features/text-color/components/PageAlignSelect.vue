<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';
import {
	PAGE_TEXT_ANCHOR_OPTIONS,
	isPageTextAnchor,
} from '@/lib/fabric/pageAlign';
import type { PageTextAnchor } from '@/types/page';
import type { CustomSelectOption } from '@/types/ui';

/** Valor que no coincide con ningún ancla: el select es solo de acción. */
const ACTION_SELECT_VALUE = '';

const emit = defineEmits<{
	align: [anchor: PageTextAnchor];
}>();

const options = computed((): ReadonlyArray<CustomSelectOption<PageTextAnchor>> => {
	return PAGE_TEXT_ANCHOR_OPTIONS.map((option) => {
		return {
			value: option.value,
			label: option.label,
		};
	});
});

const onUpdate = (value: string) => {
	if (!isPageTextAnchor(value)) {
		return;
	}

	emit('align', value);
};

const anchorDotClass = (anchor: PageTextAnchor) => {
	const horizontal = anchor.endsWith('left')
		? 'justify-start'
		: anchor.endsWith('right')
			? 'justify-end'
			: 'justify-center';
	const vertical = anchor.startsWith('top')
		? 'items-start'
		: anchor.startsWith('bottom')
			? 'items-end'
			: 'items-center';

	return `${horizontal} ${vertical}`;
};
</script>

<template>
	<CustomSelect
		:model-value="ACTION_SELECT_VALUE"
		:options="options"
		label="Align to page"
		title="Align to page"
		@update:model-value="onUpdate"
	>
		<template #trigger>
			<Icon
				icon="fluent:grid-dots-24-regular"
				class="size-5 shrink-0"
				aria-hidden="true"
			/>
			<span class="text-xs whitespace-nowrap">Page align</span>
			<Icon
				icon="fluent:chevron-down-16-regular"
				class="size-3.5 shrink-0 opacity-70"
				aria-hidden="true"
			/>
		</template>

		<template #option="{ option }">
			<span
				class="flex size-4 shrink-0 rounded-sm border border-current/40 p-0.5"
				:class="
					anchorDotClass(
						isPageTextAnchor(option.value) ? option.value : 'middle-center',
					)
				"
				aria-hidden="true"
			>
				<span class="size-1 rounded-full bg-current" />
			</span>
			<span class="whitespace-nowrap">{{ option.label }}</span>
		</template>
	</CustomSelect>
</template>
