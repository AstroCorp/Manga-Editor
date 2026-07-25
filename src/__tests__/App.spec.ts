import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { shallowRef } from 'vue';
import App from '../App.vue';

vi.mock('@/composables/fabric/useFabricCanvas', () => {
	return {
		useFabricCanvas: () => {
			return {
				fabricCanvas: shallowRef(null),
				init: vi.fn(),
				pageWidth: shallowRef(1753),
				pageHeight: shallowRef(2480),
			};
		},
	};
});

vi.mock('@/composables/panel/usePanelGuides', () => {
	return {
		usePanelGuides: () => {
			return {
				clearGuides: vi.fn(),
				refreshGuides: vi.fn(),
			};
		},
	};
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('App', () => {
	it('renders header, guide toggle and sidebar tabs', () => {
		const pinia = createPinia();
		
		setActivePinia(pinia);

		const wrapper = mount(App, {
			attachTo: document.body,
			global: {
				plugins: [pinia],
			},
		});

		expect(wrapper.text()).toContain('Manga Editor');
		expect(wrapper.text()).toContain('Config');
		expect(wrapper.text()).toContain('Layouts');
		expect(
			wrapper.find('button[aria-label="Hide guides"]').exists(),
		).toBe(true);

		wrapper.unmount();
	});
});
