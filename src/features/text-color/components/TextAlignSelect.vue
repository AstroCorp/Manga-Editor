<script setup lang="ts">
import { computed } from 'vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';
import {
	TEXT_ALIGN_OPTIONS,
	normalizeTextAlign,
	textAlignIconName,
} from '@/lib/fabric/textStyles';
import type { TextTextAlign } from '@/types/page';
import type { CustomSelectOption } from '@/types/ui';

const props = withDefaults(
	defineProps<{
		modelValue: TextTextAlign;
		menuAlign?: 'left' | 'right';
		hideTriggerLabel?: boolean;
		variant?: 'field' | 'toolbar';
	}>(),
	{
		menuAlign: 'left',
		hideTriggerLabel: false,
		variant: 'toolbar',
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: TextTextAlign];
}>();

const options = computed((): ReadonlyArray<CustomSelectOption<TextTextAlign>> => {
	return TEXT_ALIGN_OPTIONS.map((option) => {
		return {
			value: option.value,
			label: option.label,
			icon: textAlignIconName(option.value),
		};
	});
});

const onUpdate = (value: string) => {
	const next = normalizeTextAlign(value);

	if (next) {
		emit('update:modelValue', next);
	}
};
</script>

<template>
	<CustomSelect
		:model-value="props.modelValue"
		:options="options"
		label="Text align"
		title="Text align"
		:hide-trigger-label="props.hideTriggerLabel"
		:menu-align="props.menuAlign"
		:variant="props.variant"
		@update:model-value="onUpdate"
	/>
</template>
