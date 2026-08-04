import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { computed, ref } from 'vue';
import App from '../App.vue';

vi.mock('@/composables/fabric/useEditorCanvas', () => {
	return {
		useEditorCanvas: () => {
			return {
				stageStyle: ref({ width: '100px', height: '100px' }),
				scaleStyle: ref({
					width: '100px',
					height: '100px',
					transform: 'scale(0.75)',
				}),
				overlayViews: computed(() => []),
				cancelStroke: vi.fn(),
			};
		},
	};
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('App', () => {
	it('renders header, page strip and sidebar tabs', () => {
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
		expect(
			wrapper.find('button[aria-label="Clear page"]').exists(),
		).toBe(true);
		expect(
			wrapper.find('button[aria-label="Delete selection"]').exists(),
		).toBe(false);
		expect(wrapper.find('button[aria-label="Add page"]').exists()).toBe(
			true,
		);
		expect(wrapper.find('[aria-label="Zoom"]').exists()).toBe(true);
		expect(wrapper.find('[aria-label="Theme"]').exists()).toBe(true);

		wrapper.unmount();
	});
});
