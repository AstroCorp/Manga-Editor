<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { useHoldRepeat } from '@/composables/ui/useHoldRepeat';
import type { NumberInputProps } from '@/types/ui';

const MIXED_VALUE_LABEL = 'mix';

const props = withDefaults(defineProps<NumberInputProps>(), {
	min: undefined,
	max: undefined,
	step: 1,
	decimals: 0,
	fallbackValue: undefined,
	mixedLabel: MIXED_VALUE_LABEL,
	variant: 'field',
	inputWidthClass: 'w-14',
	commitOnInput: false,
	inputmode: 'numeric',
	increaseLabel: 'Increase',
	decreaseLabel: 'Decrease',
	title: undefined,
	suffix: undefined,
});

const emit = defineEmits<{
	'update:modelValue': [value: number];
}>();

const draft = ref('');
const focused = ref(false);

const isMixed = computed(() => {
	return props.modelValue === null;
});

const resolvedValue = computed(() => {
	if (props.modelValue !== null) {
		return props.modelValue;
	}

	return props.fallbackValue ?? props.min ?? 0;
});

const formatNumber = (value: number): string => {
	if (props.decimals <= 0) {
		return String(Math.round(value));
	}

	const factor = 10 ** props.decimals;

	return String(Math.round(value * factor) / factor);
};

const displayFromProps = (): string => {
	if (isMixed.value) {
		return props.mixedLabel;
	}

	return formatNumber(props.modelValue as number);
};

watch(
	() => [props.modelValue, props.fallbackValue, props.mixedLabel] as const,
	() => {
		if (focused.value && isMixed.value) {
			return;
		}

		draft.value = displayFromProps();
	},
	{ immediate: true },
);

const clamp = (value: number): number => {
	let next = value;

	if (props.min !== undefined) {
		next = Math.max(props.min, next);
	}

	if (props.max !== undefined) {
		next = Math.min(props.max, next);
	}

	if (props.decimals <= 0) {
		return Math.round(next);
	}

	const factor = 10 ** props.decimals;

	return Math.round(next * factor) / factor;
};

const parseDraft = (raw: string): number | null => {
	const trimmed = raw.trim();

	if (trimmed === '' || trimmed.toLowerCase() === props.mixedLabel.toLowerCase()) {
		return null;
	}

	const value = Number(trimmed);

	if (!Number.isFinite(value)) {
		return null;
	}

	if (props.min !== undefined && value < props.min) {
		return null;
	}

	if (props.max !== undefined && value > props.max) {
		return null;
	}

	return clamp(value);
};

const commitValue = (next: number) => {
	if (next === props.modelValue) {
		draft.value = formatNumber(next);

		return;
	}

	draft.value = formatNumber(next);
	emit('update:modelValue', next);
};

const nudge = (delta: number) => {
	const next = clamp(resolvedValue.value + delta);

	commitValue(next);
};

const { onPointerDown: onIncreasePointerDown } = useHoldRepeat(() => {
	nudge(props.step);
});

const { onPointerDown: onDecreasePointerDown } = useHoldRepeat(() => {
	nudge(-props.step);
});

const onFocus = () => {
	focused.value = true;

	if (!isMixed.value) {
		return;
	}

	draft.value = formatNumber(resolvedValue.value);
};

const commitDraft = () => {
	const raw = draft.value;
	const trimmed = raw.trim();

	if (trimmed.toLowerCase() === props.mixedLabel.toLowerCase()) {
		draft.value = displayFromProps();

		return false;
	}

	const next = parseDraft(raw);

	if (next === null) {
		draft.value = displayFromProps();

		return false;
	}

	commitValue(next);

	return true;
};

const onBlur = () => {
	focused.value = false;
	commitDraft();
};

const onInput = (event: Event) => {
	const value = (event.target as HTMLInputElement).value;

	draft.value = value;

	if (!props.commitOnInput) {
		return;
	}

	const next = parseDraft(value);

	if (next === null || next === props.modelValue) {
		return;
	}

	emit('update:modelValue', next);
};

const onKeydown = (event: KeyboardEvent) => {
	if (event.key === 'ArrowUp') {
		event.preventDefault();
		nudge(props.step);

		return;
	}

	if (event.key === 'ArrowDown') {
		event.preventDefault();
		nudge(-props.step);

		return;
	}

	if (event.key !== 'Enter') {
		return;
	}

	commitDraft();
	(event.target as HTMLInputElement).blur();
};

const onChange = () => {
	commitDraft();
};
</script>

<template>
	<div
		:class="
			variant === 'toolbar'
				? 'flex h-9 items-stretch gap-0.5 overflow-hidden rounded-md text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 focus-within:bg-blue-50 focus-within:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:focus-within:bg-blue-950 dark:focus-within:text-blue-400'
				: 'inline-flex h-9 items-stretch gap-px overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 transition hover:border-blue-600/50 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/25'
		"
		:title="title"
	>
		<slot name="leading" />
		<input
			:value="draft"
			type="text"
			:inputmode="inputmode"
			class="h-full appearance-none border-0 bg-transparent text-center text-sm text-inherit outline-none ring-0 tabular-nums"
			:class="
				variant === 'toolbar'
					? ['px-0 hover:bg-transparent focus:bg-transparent', inputWidthClass]
					: ['px-2', inputWidthClass]
			"
			:aria-label="ariaLabel"
			@focus="onFocus"
			@blur="onBlur"
			@input="onInput"
			@change="onChange"
			@keydown="onKeydown"
		/>
		<span
			v-if="suffix"
			class="inline-flex select-none items-center pr-1.5 text-sm text-slate-500 dark:text-slate-400"
			aria-hidden="true"
		>
			{{ suffix }}
		</span>
		<div class="flex w-5 shrink-0 flex-col">
			<button
				type="button"
				tabindex="-1"
				class="flex flex-1 items-center justify-center bg-transparent text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
				:aria-label="increaseLabel"
				@pointerdown="onIncreasePointerDown"
			>
				<Icon icon="fluent:chevron-up-16-regular" class="size-3" />
			</button>
			<button
				type="button"
				tabindex="-1"
				class="flex flex-1 items-center justify-center bg-transparent text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
				:aria-label="decreaseLabel"
				@pointerdown="onDecreasePointerDown"
			>
				<Icon icon="fluent:chevron-down-16-regular" class="size-3" />
			</button>
		</div>
	</div>
</template>
