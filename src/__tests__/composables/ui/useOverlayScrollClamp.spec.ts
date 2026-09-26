import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useOverlayScrollClamp } from '@/composables/ui/useOverlayScrollClamp';
import { findScrollParent } from '@/lib/dom/clampOverlayToScrollPort';
import type { OverlayAnchorSource } from '@/types/ui';

type ClampHost = {
	shiftX: number;
	shiftY: number;
	updateClamp: () => void;
};

const rect = (
	left: number,
	top: number,
	right: number,
	bottom: number,
): DOMRect => {
	return {
		left,
		top,
		right,
		bottom,
		width: right - left,
		height: bottom - top,
		x: left,
		y: top,
		toJSON: () => ({}),
	} as DOMRect;
};

describe('useOverlayScrollClamp', () => {
	it('clears the shift when the anchor or the overlay is missing', async () => {
		const overlayEl = ref<HTMLElement | null>(null);
		const anchor = ref<OverlayAnchorSource>({
			left: null,
			top: null,
			placement: 'above',
		});
		const Host = defineComponent({
			setup() {
				return useOverlayScrollClamp(overlayEl, () => anchor.value);
			},
			template: '<div />',
		});
		const wrapper = mount(Host);
		const vm = wrapper.vm as unknown as ClampHost;

		await nextTick();
		vm.updateClamp();

		expect(vm.shiftX).toBe(0);
		expect(vm.shiftY).toBe(0);
		wrapper.unmount();
	});

	it('shifts the overlay so it stays inside the scrollport', async () => {
		const port = document.createElement('div');
		const stage = document.createElement('div');
		const overlay = document.createElement('div');

		port.style.overflowX = 'auto';
		port.style.overflowY = 'auto';
		stage.style.position = 'relative';
		port.append(stage);
		stage.append(overlay);
		document.body.append(port);
		Object.defineProperty(overlay, 'offsetParent', {
			configurable: true,
			get: () => stage,
		});
		Object.defineProperty(overlay, 'offsetWidth', { get: () => 320 });
		Object.defineProperty(overlay, 'offsetHeight', { get: () => 44 });
		stage.getBoundingClientRect = () => rect(100, 50, 500, 350);
		port.getBoundingClientRect = () => rect(0, 0, 400, 300);

		const overlayEl = ref<HTMLElement | null>(overlay);
		const anchor = ref<OverlayAnchorSource>({
			left: 380,
			top: 40,
			placement: 'above',
		});
		const Host = defineComponent({
			setup() {
				return useOverlayScrollClamp(overlayEl, () => anchor.value);
			},
			template: '<div />',
		});
		const wrapper = mount(Host);
		const vm = wrapper.vm as unknown as ClampHost;

		await nextTick();
		vm.updateClamp();

		expect(overlay.offsetParent).toBe(stage);
		expect(findScrollParent(overlay)).toBe(port);
		expect(vm.shiftX).toBe(232 - 480);
		expect(vm.shiftY).toBe(0);

		anchor.value = { left: null, top: 40, placement: 'above' };
		await nextTick();
		vm.updateClamp();
		expect(vm.shiftX).toBe(0);

		wrapper.unmount();
		port.remove();
	});
});
