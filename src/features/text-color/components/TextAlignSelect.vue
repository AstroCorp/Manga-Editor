<script setup lang="ts">
import { computed } from 'vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';
import {
	TEXT_ALIGN_OPTIONS,
	textAlignIconName,
} from '@/lib/fabric/textStyles';
import type { TextTextAlign } from '@/types/page';
import type { CustomSelectOption } from '@/types/ui';

const props = defineProps<{
	modelValue: TextTextAlign;
}>();

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

const onUpdate = (value: TextTextAlign) => {
	emit('update:modelValue', value);
};
</script>

<template>
	<CustomSelect
		:model-value="props.modelValue"
		:options="options"
		aria-label="Text align"
		title="Text align"
		@update:model-value="onUpdate"
	/>
</template>
