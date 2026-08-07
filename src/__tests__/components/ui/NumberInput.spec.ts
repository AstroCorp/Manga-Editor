import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NumberInput from '@/components/ui/NumberInput.vue';

const mountInput = (props: Record<string, unknown> = {}) => {
	return mount(NumberInput, {
		props: {
			modelValue: 10,
			min: 0,
			max: 100,
			ariaLabel: 'Value',
			increaseLabel: 'Increase value',
			decreaseLabel: 'Decrease value',
			...props,
		},
		global: {
			stubs: {
				Icon: true,
			},
		},
	});
};

describe('NumberInput', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('nudges with stepper buttons and clamps to min/max', async () => {
		const wrapper = mountInput({ modelValue: 10 });

		await wrapper
			.get('button[aria-label="Increase value"]')
			.trigger('pointerdown');
		window.dispatchEvent(new Event('pointerup'));

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([11]);

		await wrapper.setProps({ modelValue: 1 });
		await wrapper
			.get('button[aria-label="Decrease value"]')
			.trigger('pointerdown');
		window.dispatchEvent(new Event('pointerup'));

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0]);

		await wrapper.setProps({ modelValue: 0 });
		await wrapper
			.get('button[aria-label="Decrease value"]')
			.trigger('pointerdown');
		window.dispatchEvent(new Event('pointerup'));

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0]);
	});

	it('nudges with arrow keys', async () => {
		const wrapper = mountInput({ modelValue: 10, step: 2 });
		const input = wrapper.get('input[aria-label="Value"]');

		await input.trigger('keydown', { key: 'ArrowUp' });
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([12]);

		await wrapper.setProps({ modelValue: 12 });
		await input.trigger('keydown', { key: 'ArrowDown' });
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([10]);
	});

	it('repeats while the stepper is held', async () => {
		vi.useFakeTimers();
		const wrapper = mountInput({ modelValue: 10 });

		await wrapper
			.get('button[aria-label="Increase value"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('update:modelValue')).toHaveLength(1);

		await vi.advanceTimersByTimeAsync(400);
		await vi.advanceTimersByTimeAsync(55);

		expect((wrapper.emitted('update:modelValue') ?? []).length).toBeGreaterThan(1);

		window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
	});

	it('shows mix and nudges from fallbackValue', async () => {
		const wrapper = mountInput({
			modelValue: null,
			fallbackValue: 18,
		});

		const input = wrapper.get('input[aria-label="Value"]');

		expect((input.element as HTMLInputElement).value).toBe('mix');

		await wrapper
			.get('button[aria-label="Increase value"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([19]);
	});

	it('reveals the fallback value on focus when mixed', async () => {
		const wrapper = mountInput({
			modelValue: null,
			fallbackValue: 22,
		});

		const input = wrapper.get('input[aria-label="Value"]');

		await input.trigger('focus');

		expect((input.element as HTMLInputElement).value).toBe('22');
	});

	it('commits typed values on change and ignores out-of-range while typing with commitOnInput', async () => {
		const wrapper = mountInput({
			modelValue: 24,
			min: 8,
			max: 200,
			commitOnInput: true,
		});

		const input = wrapper.get('input[aria-label="Value"]');

		await input.setValue('36');
		await input.trigger('input');
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([36]);

		await input.setValue('3');
		await input.trigger('input');
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([36]);
	});
});
