import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, h, nextTick } from 'vue';
import LayoutsPanel from '@/components/sidebar/LayoutsPanel.vue';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import { useLayoutsStore } from '@/stores/layouts';
import type { PresetLayout } from '@/types/layouts';

vi.mock('@vueuse/core', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@vueuse/core')>();

	return {
		...actual,
		useEventListener: vi.fn(),
		useIntersectionObserver: vi.fn(),
	};
});

const samplePreset = (id: string): PresetLayout => {
	return {
		id,
		layout: {
			width: 600,
			height: 900,
			layers: [
				{
					shapes: [
						{
							id: `panel-${id}`,
							points: [
								{ x: 0, y: 0 },
								{ x: 40, y: 0 },
								{ x: 40, y: 40 },
							],
							image: null,
						},
					],
				},
			],
		},
	};
};

const MasonryWallStub = defineComponent({
	name: 'MasonryWall',
	props: {
		items: {
			type: Array,
			required: true,
		},
		scrollContainer: {
			type: Object as () => HTMLElement | null,
			default: null,
		},
	},
	emits: ['redraw'],
	setup(props, { emit, slots }) {
		return () => {
			emit('redraw');

			return h(
				'div',
				{ 'data-testid': 'masonry-wall' },
				props.items.map((item, index) => {
					return slots.default?.({
						item,
						column: 0,
						columnCount: 1,
						row: index,
						index,
					});
				}),
			);
		};
	},
});

describe('LayoutsPanel', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('passes the presets scroll element to MasonryWall for scroll restore', async () => {
		const layoutsStore = useLayoutsStore();

		layoutsStore.presets = [samplePreset('a'), samplePreset('b')];
		layoutsStore.presetsStatus = PRESETS_LOAD_STATUS.Ready;

		const wrapper = mount(LayoutsPanel, {
			global: {
				stubs: {
					MasonryWall: MasonryWallStub,
					Icon: true,
					PagePreview: true,
					ConfirmModal: true,
					LayoutThumbSkeleton: true,
				},
			},
			attachTo: document.body,
		});

		await nextTick();

		const masonry = wrapper.findComponent(MasonryWallStub);
		const scrollEl = wrapper.find('.overflow-y-auto').element;

		expect(masonry.exists()).toBe(true);
		expect(masonry.props('scrollContainer')).toBe(scrollEl);

		wrapper.unmount();
	});

	it('passes the custom scroll element to MasonryWall for scroll restore', async () => {
		const layoutsStore = useLayoutsStore();

		layoutsStore.presets = [];
		layoutsStore.presetsStatus = PRESETS_LOAD_STATUS.Ready;
		layoutsStore.customLayouts = [samplePreset('custom-1')];

		const wrapper = mount(LayoutsPanel, {
			global: {
				stubs: {
					MasonryWall: MasonryWallStub,
					Icon: true,
					PagePreview: true,
					ConfirmModal: true,
					LayoutThumbSkeleton: true,
				},
			},
			attachTo: document.body,
		});

		await nextTick();

		const walls = wrapper.findAllComponents(MasonryWallStub);
		const scrollEls = wrapper.findAll('.overflow-y-auto');
		const customScroll = scrollEls[1];

		expect(walls).toHaveLength(1);
		expect(customScroll?.classes()).toContain('max-h-87.5');
		expect(customScroll?.classes()).not.toContain('h-87.5');
		expect(walls[0]?.props('scrollContainer')).toBe(customScroll?.element);

		wrapper.unmount();
	});
});
