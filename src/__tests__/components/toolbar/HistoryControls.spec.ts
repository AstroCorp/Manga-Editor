import { describe, expect, it, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HistoryControls from '@/components/toolbar/HistoryControls.vue';
import { HISTORY_LABEL } from '@/lib/history/historyEnums';
import { Shape } from '@/models/Shape';
import { useHistoryStore } from '@/stores/history';
import { useMangaStore } from '@/stores/manga';

describe('HistoryControls', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('disables undo and redo on the baseline', () => {
		const pinia = createPinia();

		setActivePinia(pinia);
		useMangaStore();

		const wrapper = mount(HistoryControls, {
			global: {
				plugins: [pinia],
				stubs: { Icon: true },
			},
		});

		expect(
			wrapper.get('button[aria-label="Undo"]').attributes('disabled'),
		).toBeDefined();
		expect(
			wrapper.get('button[aria-label="Redo"]').attributes('disabled'),
		).toBeDefined();

		wrapper.unmount();
	});

	it('lists movements and jumps to the selected entry', async () => {
		const pinia = createPinia();

		setActivePinia(pinia);

		const mangaStore = useMangaStore();
		const historyStore = useHistoryStore();

		mangaStore.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 8, y: 0 },
					{ x: 8, y: 8 },
				],
				2,
			),
		);

		const wrapper = mount(HistoryControls, {
			global: {
				plugins: [pinia],
				stubs: { Icon: true },
			},
		});

		await wrapper.get('button[aria-label="History"]').trigger('click');

		const items = wrapper.findAll('[role="menuitem"]');

		expect(items).toHaveLength(2);
		expect(items[0]?.text()).toContain(HISTORY_LABEL.AddPanel);
		expect(items[1]?.text()).toContain(HISTORY_LABEL.Start);

		await items[1]!.trigger('click');

		expect(mangaStore.shapes).toHaveLength(0);
		expect(historyStore.currentLabel).toBe(HISTORY_LABEL.Start);
		expect(wrapper.find('[role="menu"]').exists()).toBe(false);

		wrapper.unmount();
	});

	it('undoes from the toolbar button', async () => {
		const pinia = createPinia();

		setActivePinia(pinia);

		const mangaStore = useMangaStore();

		mangaStore.addPage();

		const wrapper = mount(HistoryControls, {
			global: {
				plugins: [pinia],
				stubs: { Icon: true },
			},
		});

		await wrapper.get('button[aria-label="Undo"]').trigger('click');

		expect(mangaStore.pages).toHaveLength(1);

		wrapper.unmount();
	});

	it('redoes from the toolbar button', async () => {
		const pinia = createPinia();

		setActivePinia(pinia);

		const mangaStore = useMangaStore();

		mangaStore.addPage();
		mangaStore.undoHistory();

		const wrapper = mount(HistoryControls, {
			global: {
				plugins: [pinia],
				stubs: { Icon: true },
			},
		});

		await wrapper.get('button[aria-label="Redo"]').trigger('click');

		expect(mangaStore.pages).toHaveLength(2);

		wrapper.unmount();
	});
});
