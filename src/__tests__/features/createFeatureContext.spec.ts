import { describe, it, expect, vi } from 'vitest';
import { ref, shallowRef } from 'vue';
import { createFeatureContext } from '@/features/createFeatureContext';
import type { Canvas } from 'fabric';
import type { CanvasActions } from '@/types/editor';

describe('createFeatureContext', () => {
	it('wires action bus, canvas actions, hooks and overlays', () => {
		const canvasActions: CanvasActions = {
			cancelStroke: () => undefined,
			exportDataUrl: () => null,
			resetZoomView: () => undefined,
			addSimpleText: () => undefined,
		};
		const afterPageApplyHooks: Array<() => void> = [];
		const overlays: Array<{ id: string }> = [];
		const applyActivePage = vi.fn(async () => undefined);
		const discardSelection = vi.fn();

		const ctx = createFeatureContext({
			fabricCanvas: shallowRef<Canvas | null>(null),
			rootEl: ref(null),
			pageSize: ref({ width: 800, height: 1200 }),
			zoomFactor: ref(1),
			stageStyle: ref({}),
			scaleStyle: ref({}),
			canvasActions,
			afterPageApplyHooks,
			overlays: overlays as never[],
			applyActivePage,
			discardSelection,
		});

		const cancelStroke = vi.fn();
		const clearShapeMenu = vi.fn();

		ctx.actions.register({
			cancelStroke,
			clearShapeMenu,
		});
		ctx.actions.cancelStroke();
		ctx.actions.clearShapeMenu();

		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(clearShapeMenu).toHaveBeenCalledOnce();

		ctx.registerCanvasAction({
			resetZoomView: vi.fn(),
		});
		expect(typeof canvasActions.resetZoomView).toBe('function');

		const hook = vi.fn();

		ctx.onAfterPageApply(hook);
		expect(afterPageApplyHooks).toEqual([hook]);

		ctx.addOverlay({
			id: 'menu',
			component: {} as never,
			props: {},
		});
		expect(overlays).toHaveLength(1);

		expect(ctx.applyActivePage).toBe(applyActivePage);
		expect(ctx.discardSelection).toBe(discardSelection);
	});
});
