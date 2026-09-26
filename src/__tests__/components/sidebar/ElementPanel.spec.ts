import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref, shallowRef } from 'vue';
import ElementPanel from '@/components/sidebar/ElementPanel.vue';
import { useElementInspectorStore } from '@/stores/elementInspector';
import { useMangaStore } from '@/stores/manga';
import { useSelectionStore } from '@/stores/selection';
import type { ShapeInspectorApi, TextInspectorApi } from '@/types/inspector';

const shapeApi = (): ShapeInspectorApi => {
	return {
		elementId: ref<string | null>('shape-1'),
		hasImage: ref(true),
		isGrayscale: ref(false),
		isFlipX: ref(false),
		isFlipY: ref(false),
		fill: ref<string | null>(null),
		strokes: shallowRef([
			{ width: 2, color: '#111111' },
			{ width: 4, color: '#ff0000' },
		]),
		deleteShape: vi.fn(),
		clearImage: vi.fn(),
		placeImage: vi.fn(),
		toggleGrayscale: vi.fn(),
		toggleFlipX: vi.fn(),
		toggleFlipY: vi.fn(),
		toggleFill: vi.fn(),
		setFillColor: vi.fn(),
		previewFillColor: vi.fn(),
		setEdgeStroke: vi.fn(),
		previewEdgeStroke: vi.fn(),
		highlightEdge: vi.fn(),
	};
};

const textApi = (): TextInspectorApi => {
	return {
		elementId: ref<string | null>('text-1'),
		colors: ref(['#112233']),
		strokeColors: ref(['#000000']),
		bold: ref(false),
		italic: ref(false),
		underline: ref(false),
		linethrough: ref(false),
		fontSize: ref(24),
		dominantFontSize: ref(24),
		fontFamily: ref('Arial'),
		dominantFontFamily: ref('Arial'),
		strokeWidth: ref(0),
		dominantStrokeWidth: ref(0),
		lineHeight: ref(1.16),
		dominantLineHeight: ref(1.16),
		textAlign: ref('left'),
		hasBox: ref(true),
		boxFill: ref('#ffffff'),
		boxStroke: ref('#000000'),
		boxStrokeWidth: ref(2),
		boxCornerRadius: ref(8),
		boxPadding: ref(12),
		boxWidth: ref(224),
		boxHeight: ref(48),
		boxVerticalAlign: ref('middle'),
		setColor: vi.fn(),
		setStrokeColor: vi.fn(),
		toggleBold: vi.fn(),
		toggleItalic: vi.fn(),
		toggleUnderline: vi.fn(),
		toggleLinethrough: vi.fn(),
		setFontSize: vi.fn(),
		setFontFamily: vi.fn(),
		setStrokeWidth: vi.fn(),
		setLineHeight: vi.fn(),
		setTextAlign: vi.fn(),
		setBoxFill: vi.fn(),
		setBoxStroke: vi.fn(),
		setBoxStrokeWidth: vi.fn(),
		setBoxCornerRadius: vi.fn(),
		setBoxPadding: vi.fn(),
		setBoxWidth: vi.fn(),
		setBoxHeight: vi.fn(),
		setBoxVerticalAlign: vi.fn(),
		alignToPage: vi.fn(),
		deleteText: vi.fn(),
	};
};

const mountPanel = () => {
	const pinia = createPinia();

	setActivePinia(pinia);

	const wrapper = mount(ElementPanel, {
		global: {
			plugins: [pinia],
			stubs: {
				Icon: true,
			},
		},
	});

	return wrapper;
};

describe('ElementPanel', () => {
	it('asks to select an element when nothing is focused', () => {
		const wrapper = mountPanel();

		expect(wrapper.text()).toContain('Select a panel or a text');
		wrapper.unmount();
	});

	it('shows panel options and forwards fill changes', async () => {
		const wrapper = mountPanel();
		const mangaStore = useMangaStore();
		const selectionStore = useSelectionStore();
		const inspectorStore = useElementInspectorStore();
		const api = shapeApi();

		inspectorStore.bindShape(api);
		selectionStore.setFocused({
			kind: 'shape',
			id: 'shape-1',
			layerId: mangaStore.activeLayer.id,
		});
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain('Fill panel');
		expect(wrapper.get('[data-testid="panel-fill-value"]').text()).toBe('None');
		expect(wrapper.text()).toContain('Edge 1');
		expect(wrapper.text()).toContain('Edge 2');
		expect(wrapper.text()).toContain('Black and white');

		await wrapper.get('button[aria-label="Fill panel"]').trigger('click');

		expect(api.toggleFill).toHaveBeenCalledOnce();

		const input = wrapper.get('input[aria-label="Fill color"]');

		await input.setValue('#00ff00');

		expect(api.previewFillColor).toHaveBeenCalledExactlyOnceWith('#00ff00');
		expect(api.setFillColor).toHaveBeenCalledExactlyOnceWith('#00ff00');

		api.fill.value = '#00ff00';
		await wrapper.vm.$nextTick();

		expect(wrapper.get('[data-testid="panel-fill-value"]').text()).toBe(
			'#00ff00',
		);
		expect(wrapper.get('button[aria-label="Remove fill"]').exists()).toBe(true);

		const sections = wrapper.findAll('section').map((node) => {
			return node.attributes('aria-label');
		});

		expect(sections).toEqual([
			'Panel fill',
			'Panel edges',
			'Panel image',
			'Panel actions',
		]);
		wrapper.unmount();
	});

	it('waits until the canvas selection matches the focused panel', async () => {
		const wrapper = mountPanel();
		const mangaStore = useMangaStore();
		const selectionStore = useSelectionStore();
		const inspectorStore = useElementInspectorStore();

		inspectorStore.bindShape(shapeApi());
		selectionStore.setFocused({
			kind: 'shape',
			id: 'other-shape',
			layerId: mangaStore.activeLayer.id,
		});
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain('Updating the selection');
		expect(wrapper.find('button[aria-label="Fill panel"]').exists()).toBe(false);
		wrapper.unmount();
	});

	it('shows text and box options for the focused text', async () => {
		const wrapper = mountPanel();
		const mangaStore = useMangaStore();
		const selectionStore = useSelectionStore();
		const inspectorStore = useElementInspectorStore();
		const api = textApi();

		inspectorStore.bindText(api);
		selectionStore.setFocused({
			kind: 'text',
			id: 'text-1',
			layerId: mangaStore.activeLayer.id,
		});
		await wrapper.vm.$nextTick();

		expect(wrapper.get('[aria-label="Text format"]').exists()).toBe(true);
		expect(wrapper.get('[aria-label="Box format"]').exists()).toBe(true);

		const textLabels = wrapper
			.get('[aria-label="Text format"]')
			.findAll('[aria-label]')
			.map((node) => {
				return node.attributes('aria-label');
			});

		expect(textLabels.indexOf('Font family')).toBeLessThan(
			textLabels.indexOf('Text style'),
		);
		expect(textLabels.indexOf('Text style')).toBeLessThan(
			textLabels.indexOf('Text color'),
		);
		expect(textLabels.indexOf('Text color')).toBeLessThan(
			textLabels.indexOf('Stroke color'),
		);

		await wrapper.get('button[aria-label="Bold"]').trigger('click');
		await wrapper.get('button[aria-label="Delete text"]').trigger('click');

		expect(api.toggleBold).toHaveBeenCalledOnce();
		expect(api.deleteText).toHaveBeenCalledOnce();
		wrapper.unmount();
	});
});
