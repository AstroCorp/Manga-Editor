import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PagePreview from '@/components/page/PagePreview.vue';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';

describe('PagePreview', () => {
	it('renders white fill polygons only when whiteFill is enabled', () => {
		const filled = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);
		const empty = Shape.create(
			[
				{ x: 20, y: 0 },
				{ x: 30, y: 0 },
				{ x: 30, y: 10 },
			],
			2,
		);

		filled.setWhiteFill(true);

		const wrapper = mount(PagePreview, {
			props: {
				width: 100,
				height: 100,
				shapes: [filled, empty],
			},
		});
		const polygons = wrapper.findAll('polygon');
		const fills = polygons.filter((node) => {
			return node.attributes('fill') === '#ffffff';
		});
		const strokes = polygons.filter((node) => {
			return node.attributes('fill') === 'none';
		});

		expect(fills).toHaveLength(1);
		expect(strokes).toHaveLength(2);
		expect(fills[0]?.attributes('points')).toBe('0,0 10,0 10,10');
	});

	it('draws fill before image and stroke after image', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 40, y: 0 },
				{ x: 40, y: 40 },
			],
			3,
		);

		shape.setWhiteFill(true);
		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 20,
				top: 20,
				scaleX: 1,
				scaleY: 1,
				width: 10,
				height: 10,
			}),
		);

		const wrapper = mount(PagePreview, {
			props: {
				width: 100,
				height: 100,
				shapes: [shape],
			},
		});
		const children = wrapper.find('svg').element.children;
		const tags = [...children].map((node) => {
			return node.tagName.toLowerCase();
		});

		expect(tags).toEqual(['rect', 'polygon', 'image', 'polygon']);
		expect(children[1]?.getAttribute('fill')).toBe('#ffffff');
		expect(children[3]?.getAttribute('fill')).toBe('none');
	});
});
