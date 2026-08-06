<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import type { CustomSelectOption } from '@/types/ui';

const props = withDefaults(
	defineProps<{
		modelValue: string;
		options: ReadonlyArray<CustomSelectOption>;
		label: string;
		title?: string;
		listLabel?: string;
	}>(),
	{
		title: undefined,
		listLabel: undefined,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const listbox = ref<HTMLElement | null>(null);
const open = ref(false);
const activeIndex = ref(0);

const resolvedListLabel = computed(() => {
	return props.listLabel ?? `${props.label} options`;
});
const selectedOption = computed(() => {
	return (
		props.options.find((option) => {
			return option.value === props.modelValue;
		}) ?? props.options[0]
	);
});

const syncActiveIndex = () => {
	const index = props.options.findIndex((option) => {
		return option.value === props.modelValue;
	});

	activeIndex.value = index >= 0 ? index : 0;
};

watch(
	() => props.modelValue,
	() => {
		syncActiveIndex();
	},
	{ immediate: true },
);

onClickOutside(root, () => {
	open.value = false;
});

const toggleOpen = async () => {
	open.value = !open.value;

	if (!open.value) {
		return;
	}

	syncActiveIndex();
	await nextTick();
	listbox.value?.focus();
};

const close = () => {
	open.value = false;
	trigger.value?.focus({ preventScroll: true });
};

const selectOption = (value: string) => {
	emit('update:modelValue', value);
	close();
};

const onTriggerKeydown = (event: KeyboardEvent) => {
	if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		void toggleOpen();
	}
};

const onListKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		event.preventDefault();
		close();

		return;
	}

	if (event.key === 'ArrowDown') {
		event.preventDefault();
		activeIndex.value = (activeIndex.value + 1) % props.options.length;

		return;
	}

	if (event.key === 'ArrowUp') {
		event.preventDefault();
		activeIndex.value =
			(activeIndex.value - 1 + props.options.length) % props.options.length;

		return;
	}

	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		const option = props.options[activeIndex.value];

		if (option) {
			selectOption(option.value);
		}
	}
};

const optionClass = (value: string, index: number) => {
	const selected = value === props.modelValue;
	const active = index === activeIndex.value;

	if (selected) {
		return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400';
	}

	if (active) {
		return 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-100';
	}

	return 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-zinc-800';
};
</script>

<template>
	<div ref="root" class="relative">
		<button
			ref="trigger"
			type="button"
			class="inline-flex h-9 items-center gap-1 rounded-md px-1.5 text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			:title="title ?? label"
			:aria-label="label"
			aria-haspopup="listbox"
			:aria-expanded="open"
			@click="toggleOpen"
			@keydown="onTriggerKeydown"
		>
			<slot name="trigger" :option="selectedOption" :open="open">
				<Icon
					v-if="selectedOption?.icon"
					:icon="selectedOption.icon"
					class="size-5 shrink-0"
					aria-hidden="true"
				/>
				<span class="text-xs whitespace-nowrap">{{
					selectedOption?.label
				}}</span>
				<Icon
					icon="fluent:chevron-down-16-regular"
					class="size-3.5 shrink-0 opacity-70"
					aria-hidden="true"
				/>
			</slot>
		</button>

		<ul
			v-if="open"
			ref="listbox"
			class="absolute top-full left-0 z-40 mt-1 min-w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/15 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-black/40"
			role="listbox"
			tabindex="-1"
			:aria-label="resolvedListLabel"
			@keydown="onListKeydown"
		>
			<li
				v-for="(option, index) in options"
				:key="option.value"
				role="option"
				:aria-selected="option.value === modelValue"
			>
				<button
					type="button"
					class="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition"
					:class="optionClass(option.value, index)"
					@click="selectOption(option.value)"
					@mouseenter="activeIndex = index"
				>
					<slot name="option" :option="option" :selected="option.value === modelValue">
						<Icon
							v-if="option.icon"
							:icon="option.icon"
							class="size-4 shrink-0"
							aria-hidden="true"
						/>
						<span class="whitespace-nowrap">{{ option.label }}</span>
					</slot>
				</button>
			</li>
		</ul>
	</div>
</template>
