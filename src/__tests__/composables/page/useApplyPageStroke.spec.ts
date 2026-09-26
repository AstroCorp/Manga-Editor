import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useApplyPageStroke } from '@/composables/page/useApplyPageStroke';
import { useLayerConfigActions } from '@/composables/page/useLayerConfigActions';
import { Shape } from '@/models/Shape';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

const triangle = () => {
	return Shape.create(
		[
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
		],
		2,
	);
};

describe('useApplyPageStroke', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('is disabled without panels and ignores requests', () => {
		const { canApply, pendingApply, requestApply } = useApplyPageStroke();

		expect(canApply.value).toBe(false);

		requestApply();

		expect(pendingApply.value).toBeNull();
	});

	it('confirms and applies the layer stroke to every panel on the page', () => {
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const cancelStroke = vi.spyOn(editorStore, 'cancelStroke');
		const { setStrokeWidth, setStrokeColor } = useLayerConfigActions();
		const first = triangle();

		mangaStore.addShape(first);
		mangaStore.addLayer();

		const second = triangle();

		mangaStore.addShape(second);
		second.setEdgeStroke(0, { width: 7, color: '#00ff00' });
		setStrokeWidth(3);
		setStrokeColor('#FF0000');

		const { canApply, pendingApply, applyMessage, requestApply, confirmApply } =
			useApplyPageStroke();

		expect(canApply.value).toBe(true);
		expect(applyMessage.value).toContain('2 panels');
		expect(applyMessage.value).toContain('3px #ff0000');

		requestApply();
		expect(pendingApply.value).toBe(true);

		const epoch = mangaStore.contentResetEpoch;

		confirmApply();

		expect(pendingApply.value).toBeNull();
		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(mangaStore.contentResetEpoch).toBe(epoch + 1);

		for (const layer of mangaStore.activePage.layers) {
			expect(layer.strokeWidth).toBe(3);
			expect(layer.strokeColor).toBe('#ff0000');

			for (const shape of layer.shapes) {
				expect(shape.strokes).toEqual([
					{ width: 3, color: '#ff0000' },
					{ width: 3, color: '#ff0000' },
					{ width: 3, color: '#ff0000' },
				]);
			}
		}
	});

	it('cancel keeps the strokes untouched', () => {
		const mangaStore = useMangaStore();
		const shape = triangle();

		mangaStore.addShape(shape);
		mangaStore.setActiveLayerStrokeWidth(9);

		const { pendingApply, requestApply, cancelApply } = useApplyPageStroke();

		requestApply();
		cancelApply();

		expect(pendingApply.value).toBeNull();
		expect(shape.strokes[0]?.width).toBe(2);
	});

	it('setStrokeColor ignores invalid or unchanged colors', () => {
		const mangaStore = useMangaStore();
		const { setStrokeColor } = useLayerConfigActions();
		const spy = vi.spyOn(mangaStore, 'setActiveLayerStrokeColor');

		setStrokeColor('nope');
		setStrokeColor('#111111');

		expect(spy).not.toHaveBeenCalled();

		setStrokeColor('#123456');

		expect(spy).toHaveBeenCalledWith('#123456');
		expect(mangaStore.strokeColor).toBe('#123456');
	});
});
