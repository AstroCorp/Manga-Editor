import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref, shallowRef } from 'vue';
import { useFabricZoom } from '@/features/zoom/useFabricZoom';
import { useEditorStore } from '@/stores/editor';

const wheelHandlers: Array<(event: WheelEvent) => void> = [];

vi.mock('@vueuse/core', () => {
	return {
		useEventListener: (
			_target: unknown,
			_event: string,
			handler: (event: WheelEvent) => void,
		) => {
			wheelHandlers.push(handler);
		},
	};
});

const rect = (): DOMRect => {
	return {
		left: 10,
		top: 20,
		right: 210,
		bottom: 120,
		width: 200,
		height: 100,
		x: 10,
		y: 20,
		toJSON: () => ({}),
	} as DOMRect;
};

describe('useFabricZoom', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		wheelHandlers.length = 0;
	});

	it('scales the stage from the zoom percent and recenters the scrollport', async () => {
		const root = document.createElement('div');

		Object.defineProperty(root, 'clientWidth', { value: 200 });
		Object.defineProperty(root, 'clientHeight', { value: 100 });
		root.getBoundingClientRect = rect;
		root.scrollLeft = 40;
		root.scrollTop = 20;

		const calcOffset = vi.fn();
		const pageSize = ref({ width: 800, height: 400 });
		const zoom = useFabricZoom({
			fabricCanvas: shallowRef({ calcOffset } as never),
			rootEl: shallowRef(root),
			pageSize,
		});

		expect(zoom.zoomFactor.value).toBe(0.75);
		expect(zoom.stageStyle.value).toEqual({
			width: '600px',
			height: '300px',
		});
		expect(zoom.scaleStyle.value.transform).toBe('scale(0.75)');

		const editorStore = useEditorStore();

		editorStore.setZoomPercent(150);
		await nextTick();
		await nextTick();

		expect(root.scrollLeft).toBe(180);
		expect(root.scrollTop).toBe(90);
		expect(calcOffset).toHaveBeenCalled();

		zoom.resetZoomView();
		await nextTick();

		expect(root.scrollLeft).toBe(0);
		expect(root.scrollTop).toBe(0);
	});

	it('zooms toward the pointer on ctrl-wheel and ignores a plain wheel', async () => {
		const root = document.createElement('div');

		root.getBoundingClientRect = rect;
		root.scrollLeft = 0;
		root.scrollTop = 0;

		useFabricZoom({
			fabricCanvas: shallowRef(null),
			rootEl: shallowRef(root),
			pageSize: ref({ width: 100, height: 100 }),
		});

		const onWheel = wheelHandlers[0];

		expect(onWheel).toBeTypeOf('function');

		const plain = new WheelEvent('wheel', { deltaY: -10, cancelable: true });

		onWheel?.(plain);
		expect(useEditorStore().zoomPercent).toBe(75);

		const zoomIn = new WheelEvent('wheel', {
			deltaY: -10,
			ctrlKey: true,
			clientX: 30,
			clientY: 40,
			cancelable: true,
		});
		const preventDefault = vi.spyOn(zoomIn, 'preventDefault');

		onWheel?.(zoomIn);
		await nextTick();

		expect(preventDefault).toHaveBeenCalledOnce();
		expect(useEditorStore().zoomPercent).toBe(83);
		expect(root.scrollLeft).not.toBe(0);
	});
});
