import { describe, it, expect } from 'vitest';
import {
	createCustomLayoutEntry,
	customLayoutsSerializer,
} from '@/lib/page/customLayouts';
import type { LayoutJSON } from '@/types/layouts';

const sampleLayout = (): LayoutJSON => {
	return {
		width: 800,
		height: 1200,
		layers: [
			{
				shapes: [
					{
						id: 'panel-1',
						points: [
							{ x: 0, y: 0 },
							{ x: 40, y: 0 },
							{ x: 40, y: 40 },
						],
						image: {
							src: 'data:image/png;base64,xx',
							left: 1,
							top: 2,
							scaleX: 1,
							scaleY: 1,
							originX: 'center',
							originY: 'center',
							width: 10,
							height: 10,
							grayscale: true,
						},
					},
				],
				strokeWidth: 5,
				gridCols: 10,
				gridRows: 20,
			},
		],
	};
};

describe('customLayouts', () => {
	it('createCustomLayoutEntry strips images; stroke stays on the layer', () => {
		const entry = createCustomLayoutEntry(sampleLayout());

		expect(entry.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(entry.layout.layers[0]?.shapes).toHaveLength(1);
		expect(entry.layout.layers[0]?.shapes?.[0]?.image).toBeNull();
		expect(entry.layout.layers[0]?.shapes?.[0]).not.toHaveProperty(
			'strokeWidth',
		);
		expect(entry.layout.layers[0]?.strokeWidth).toBe(5);
		expect(entry.layout).not.toHaveProperty('shapes');
	});

	it('serializer round-trips valid custom layouts', () => {
		const entry = createCustomLayoutEntry(sampleLayout());
		const written = customLayoutsSerializer.write([entry]);
		const read = customLayoutsSerializer.read(written);

		expect(read).toHaveLength(1);
		expect(read[0]?.id).toBe(entry.id);
		expect(read[0]?.layout.width).toBe(800);
		expect(read[0]?.layout.layers[0]?.shapes?.[0]?.image).toBeNull();
	});

	it('serializer returns empty array for invalid payloads', () => {
		expect(customLayoutsSerializer.read('not-json')).toEqual([]);
		expect(customLayoutsSerializer.read('{}')).toEqual([]);
		expect(
			customLayoutsSerializer.read(
				JSON.stringify([{ id: 1, layout: { width: 1 } }]),
			),
		).toEqual([]);
		expect(
			customLayoutsSerializer.read(
				JSON.stringify([
					{
						id: 'ok',
						layout: { width: 100, height: 200, layers: [{ shapes: [] }] },
					},
					{ id: 'bad', layout: null },
				]),
			),
		).toHaveLength(1);
	});
});
