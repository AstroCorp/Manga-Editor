import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { computed, shallowRef } from 'vue';
import App from '../App.vue';

vi.mock('@/composables/fabric/useFabricCanvas', () => {
	return {
		useFabricCanvas: () => {
			return {
				fabricCanvas: shallowRef(null),
				init: vi.fn(),
				hydratePage: vi.fn(),
				exportDataUrl: vi.fn(() => null),
			};
		},
	};
});

vi.mock('@/composables/fabric/useFabricZoom', () => {
	return {
		useFabricZoom: () => {
			return {
				stageStyle: shallowRef({ width: '100px', height: '100px' }),
				scaleStyle: shallowRef({
					width: '100px',
					height: '100px',
					transform: 'scale(0.75)',
				}),
				zoomFactor: computed(() => 0.75),
				resetZoomView: vi.fn(),
			};
		},
	};
});

vi.mock('@/composables/panel/usePanelGuides', () => {
	return {
		usePanelGuides: () => {
			return {
				refreshGuides: vi.fn(),
			};
		},
	};
});

vi.mock('@/composables/panel/usePanelStroke', () => {
	return {
		usePanelStroke: () => {
			return {
				path: shallowRef([]),
				cancelStroke: vi.fn(),
				syncInteractionMode: vi.fn(),
			};
		},
	};
});

vi.mock('@/composables/panel/usePanelSelection', () => {
	return {
		usePanelSelection: () => {
			return {
				setSelectionStrokeWidth: vi.fn(() => false),
			};
		},
	};
});

vi.mock('@/composables/panel/useGridPointHover', () => {
	return {
		useGridPointHover: () => {
			return {
				hoverPoint: shallowRef(null),
				labelPosition: shallowRef(null),
			};
		},
		formatGridPointLabel: () => '',
	};
});

vi.mock('@/composables/panel/useShapeActionMenu', () => {
	return {
		useShapeActionMenu: () => {
			return {
				visible: computed(() => false),
				hasImage: shallowRef(false),
				position: shallowRef(null),
				deleteShape: vi.fn(),
				clearImage: vi.fn(),
				placeImage: vi.fn(),
				clearMenu: vi.fn(),
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
