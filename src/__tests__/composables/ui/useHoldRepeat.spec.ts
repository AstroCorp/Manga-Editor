import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useHoldRepeat } from '@/composables/ui/useHoldRepeat';

type HoldHost = {
	calls: number;
	onPointerDown: (event: PointerEvent) => void;
	stop: () => void;
};

const mountHold = () => {
	const Host = defineComponent({
		setup() {
			const calls = ref(0);
			const repeat = useHoldRepeat(
				() => {
					calls.value += 1;
				},
				{
					delayMs: 100,
					intervalMs: 50,
					fastIntervalMs: 20,
					fastAfterMs: 200,
				},
			);

			return { calls, ...repeat };
		},
		template: '<button type="button" />',
	});

	return mount(Host);
};

describe('useHoldRepeat', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('fires immediately, then repeats faster, and ignores other buttons', () => {
		vi.useFakeTimers();
		const wrapper = mountHold();
		const vm = wrapper.vm as unknown as HoldHost;
		const event = new PointerEvent('pointerdown', {
			button: 0,
			pointerId: 3,
			cancelable: true,
		});
		const preventDefault = vi.spyOn(event, 'preventDefault');

		vm.onPointerDown(event);
		expect(preventDefault).toHaveBeenCalledOnce();
		expect(vm.calls).toBe(1);

		vm.onPointerDown(
			new PointerEvent('pointerdown', { button: 2, cancelable: true }),
		);
		expect(vm.calls).toBe(1);

		vi.advanceTimersByTime(150);
		expect(vm.calls).toBe(2);

		vi.advanceTimersByTime(200);
		const afterFast = vm.calls;

		vi.advanceTimersByTime(20);
		expect(vm.calls).toBeGreaterThan(afterFast);

		window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9 }));
		const held = vm.calls;

		vi.advanceTimersByTime(40);
		expect(vm.calls).toBeGreaterThan(held);

		window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3 }));
		const stopped = vm.calls;

		vi.advanceTimersByTime(200);
		expect(vm.calls).toBe(stopped);

		wrapper.unmount();
	});

	it('stop cancels a hold before the delay elapses', () => {
		vi.useFakeTimers();
		const wrapper = mountHold();
		const vm = wrapper.vm as unknown as HoldHost;

		vm.onPointerDown(
			new PointerEvent('pointerdown', {
				button: 0,
				pointerId: 1,
				cancelable: true,
			}),
		);
		vm.stop();
		vi.advanceTimersByTime(500);

		expect(vm.calls).toBe(1);
		wrapper.unmount();
	});
});
