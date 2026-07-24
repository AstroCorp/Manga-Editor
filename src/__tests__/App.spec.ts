import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { shallowRef } from 'vue';
import App from '../App.vue';

vi.mock('@/composables/fabric/useFabricCanvas', () => {
	return {
		useFabricCanvas: () => {
			return {
				fabricCanvas: shallowRef(null),
				init: vi.fn(),
				PAGE_WIDTH: 1753,
				PAGE_HEIGHT: 2480,
			};
		},
	};
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('App', () => {
	it('renders header and sidebar tabs', () => {
		const wrapper = mount(App, {
			attachTo: document.body,
		});

		expect(wrapper.text()).toContain('Manga Editor');
		expect(wrapper.text()).toContain('Config');
		expect(wrapper.text()).toContain('Layouts');

		wrapper.unmount();
	});
});
