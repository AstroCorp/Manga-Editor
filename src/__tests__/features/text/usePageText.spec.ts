import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref, shallowRef } from 'vue';
import { usePageText } from '@/features/text/usePageText';
import * as textFabric from '@/lib/fabric/textFabric';
import * as loadGoogleFont from '@/lib/fonts/loadGoogleFont';
import { useMangaStore } from '@/stores/manga';
import type { FeatureContext } from '@/features/types';
import type { Canvas } from 'fabric';

const createCtx = (): FeatureContext => {
	const root = document.createElement('div');
	root.appendChild(document.createElement('div'));

	const canvas = {
		add: vi.fn(),
		setActiveObject: vi.fn(),
		requestRenderAll: vi.fn(),
	} as unknown as Canvas;

	return {
		fabricCanvas: shallowRef(canvas),
		rootEl: ref(root),
		pageSize: ref({ width: 800, height: 1200 }),
		zoomFactor: ref(1),
		stageStyle: ref({}),
		scaleStyle: ref({}),
		discardSelection: vi.fn(),
		actions: {
			cancelStroke: vi.fn(),
			syncInteractionMode: vi.fn(),
			strokePath: shallowRef([]),
			clearShapeMenu: vi.fn(),
			clearTextColorMenu: vi.fn(),
			register: vi.fn(),
		},
		registerCanvasAction: vi.fn(),
		onAfterPageApply: vi.fn(),
		addOverlay: vi.fn(),
		applyActivePage: vi.fn(async () => undefined),
	};
};

describe('usePageText panel insert', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.restoreAllMocks();
		vi.spyOn(loadGoogleFont, 'ensureTextFontsLoaded').mockResolvedValue(
			undefined,
		);
	});

	it('inserts simple text centered horizontally', async () => {
		const ctx = createCtx();
		const toFabric = vi
			.spyOn(textFabric, 'textBlockToFabric')
			.mockReturnValue({} as never);

		await usePageText(ctx).addSimpleText();

		const text = useMangaStore().texts[0];

		expect(text?.textAlign).toBe('center');
		expect(text?.box).toBeNull();
		expect(toFabric).toHaveBeenCalled();
		expect(loadGoogleFont.ensureTextFontsLoaded).toHaveBeenCalledWith(text);
	});

	it('inserts boxed text centered horizontally and vertically', async () => {
		const ctx = createCtx();
		vi.spyOn(textFabric, 'textBlockToFabric').mockReturnValue({} as never);

		await usePageText(ctx).addBoxedText();

		const text = useMangaStore().texts[0];

		expect(text?.textAlign).toBe('center');
		expect(text?.box?.verticalAlign).toBe('middle');
	});

	it('inserts rounded boxed text centered horizontally and vertically', async () => {
		const ctx = createCtx();
		vi.spyOn(textFabric, 'textBlockToFabric').mockReturnValue({} as never);

		await usePageText(ctx).addRoundedBoxedText();

		const text = useMangaStore().texts[0];

		expect(text?.textAlign).toBe('center');
		expect(text?.box?.verticalAlign).toBe('middle');
	});
});
