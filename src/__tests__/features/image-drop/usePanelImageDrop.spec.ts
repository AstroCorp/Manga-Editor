import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref, shallowRef } from 'vue';
import type { Canvas } from 'fabric';
import { usePanelImageDrop } from '@/features/image-drop/usePanelImageDrop';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';

const listeners = new Map<string, (event: DragEvent) => void>();

vi.mock('@vueuse/core', () => {
	return {
		useEventListener: (
			_target: unknown,
			event: string,
			handler: (event: DragEvent) => void,
		) => {
			listeners.set(event, handler);
		},
	};
});

const placeImageFileInPanel = vi.hoisted(() => {
	return vi.fn(async () => true);
});

vi.mock('@/lib/fabric/panelImagePlace', async () => {
	const actual = await vi.importActual<typeof import('@/lib/fabric/panelImagePlace')>(
		'@/lib/fabric/panelImagePlace',
	);

	return {
		...actual,
		placeImageFileInPanel,
	};
});

const panel = {
	points: [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 100, y: 100 },
		{ x: 0, y: 100 },
	],
	pathOffset: { x: 0, y: 0 },
	calcTransformMatrix: () => [1, 0, 0, 1, 0, 0],
	getCoords: () => [],
	get: (key: string) => {
		if (key === 'objectType') {
			return FABRIC_OBJECT_TYPE.Panel;
		}

		if (key === 'panelId') {
			return 'panel-1';
		}

		return undefined;
	},
};

const createCanvas = () => {
	return {
		getScenePoint: () => ({ x: 20, y: 20 }),
		getObjects: () => [panel],
		getActiveObject: () => null,
	} as unknown as Canvas;
};

describe('usePanelImageDrop', () => {
	beforeEach(() => {
		listeners.clear();
		placeImageFileInPanel.mockClear();
	});

	it('accepts file drags and ignores anything that is not an image', () => {
		usePanelImageDrop(ref(document.createElement('div')), shallowRef(createCanvas()));

		const ignored = vi.fn();

		listeners.get('dragover')?.({
			dataTransfer: { types: ['text/plain'], dropEffect: 'none' },
			preventDefault: ignored,
		} as unknown as DragEvent);
		expect(ignored).not.toHaveBeenCalled();

		const dataTransfer = { types: ['Files'], dropEffect: 'none' };
		const accepted = vi.fn();

		listeners.get('dragover')?.({
			dataTransfer,
			preventDefault: accepted,
		} as unknown as DragEvent);
		expect(accepted).toHaveBeenCalledOnce();
		expect(dataTransfer.dropEffect).toBe('copy');

		const dropPrevent = vi.fn();

		listeners.get('drop')?.({
			preventDefault: dropPrevent,
			dataTransfer: {
				files: [new File(['x'], 'note.txt', { type: 'text/plain' })],
			},
		} as unknown as DragEvent);

		expect(dropPrevent).toHaveBeenCalledOnce();
		expect(placeImageFileInPanel).not.toHaveBeenCalled();
	});

	it('places the first image into the panel under the pointer', async () => {
		const onPlaced = vi.fn();

		usePanelImageDrop(
			ref(document.createElement('div')),
			shallowRef(createCanvas()),
			onPlaced,
		);

		const file = new File(['img'], 'panel.png', { type: 'image/png' });

		listeners.get('drop')?.({
			preventDefault: vi.fn(),
			dataTransfer: { files: [file] },
		} as unknown as DragEvent);
		await vi.waitFor(() => {
			expect(onPlaced).toHaveBeenCalledOnce();
		});

		expect(placeImageFileInPanel).toHaveBeenCalledWith(
			expect.objectContaining({
				panelId: 'panel-1',
				file,
			}),
		);
	});
});
