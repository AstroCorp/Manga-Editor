import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PagePreview from '@/components/page/PagePreview.vue';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';

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

	it('draws clipped image before stroke and skips white fill with image', () => {
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

		expect(tags).toEqual(['defs', 'rect', 'g', 'polygon']);
		expect(children[3]?.getAttribute('fill')).toBe('none');
		expect(
			[...wrapper.findAll('polygon')].filter((node) => {
				return node.attributes('fill') === '#ffffff';
			}),
		).toHaveLength(0);

		const clipPolygon = wrapper.find('defs').find('polygon');
		const imageGroup = wrapper.find('g');

		expect(clipPolygon.exists()).toBe(true);
		expect(clipPolygon.attributes('points')).toBe('0,0 40,0 40,40');
		expect(imageGroup.attributes('clip-path')).toMatch(/url\(#.*img-clip-0\)/);
		expect(imageGroup.find('image').exists()).toBe(true);
	});

	it('draws white fill then stroke when panel has no image', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 40, y: 0 },
				{ x: 40, y: 40 },
			],
			3,
		);

		shape.setWhiteFill(true);

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

		expect(tags).toEqual(['defs', 'rect', 'polygon', 'polygon']);
		expect(children[2]?.getAttribute('fill')).toBe('#ffffff');
		expect(children[3]?.getAttribute('fill')).toBe('none');
	});

	it('stacks each panel as image then stroke so borders stay above art', () => {
		const withImage = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			2,
		);
		const empty = Shape.create(
			[
				{ x: 30, y: 0 },
				{ x: 50, y: 0 },
				{ x: 50, y: 20 },
			],
			2,
		);

		withImage.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 10,
				top: 10,
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
				shapes: [withImage, empty],
			},
		});
		const children = [...wrapper.find('svg').element.children].map((node) => {
			return node.tagName.toLowerCase();
		});

		// defs, page rect, image group, stroke, stroke
		expect(children).toEqual(['defs', 'rect', 'g', 'polygon', 'polygon']);
		expect(wrapper.findAll('g image')).toHaveLength(1);
		expect(
			wrapper.findAll('polygon').filter((node) => {
				return node.attributes('fill') === 'none';
			}),
		).toHaveLength(2);
	});

	it('applies rotation transform to texts and images', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
				width: 10,
				height: 10,
				originX: 'center',
				originY: 'center',
				angle: 25,
			}),
		);

		const text = TextBlock.create(5, 5);

		text.applyPatch({ angle: 40, content: 'Hi' });

		const wrapper = mount(PagePreview, {
			props: {
				width: 100,
				height: 100,
				shapes: [shape],
				texts: [text],
			},
		});

		expect(wrapper.find('g image').attributes('transform')).toBe(
			'rotate(25 10 10)',
		);
		expect(wrapper.find('text').attributes('transform')).toBe(
			'rotate(40 5 5)',
		);
		expect(wrapper.find('text').text()).toContain('Hi');
	});

	it('renders multiline text with tspans and lineHeight dy', () => {
		const text = TextBlock.create(5, 5);

		text.applyPatch({
			content: 'Hi\nthere',
			lineHeight: 1.5,
			fontSize: 20,
		});

		const wrapper = mount(PagePreview, {
			props: {
				width: 100,
				height: 100,
				shapes: [],
				texts: [text],
			},
		});

		const tspans = wrapper.findAll('text tspan');

		expect(tspans).toHaveLength(2);
		expect(tspans[0]?.text()).toContain('Hi');
		expect(tspans[1]?.text()).toContain('there');
		expect(tspans[1]?.attributes('dy')).toBe('30');
	});

	it('renders text stroke attributes when stroke width is set', () => {
		const text = TextBlock.create(5, 5);

		text.applyPatch({
			content: 'Hi',
			stroke: '#ff0000',
			strokeWidth: 2,
		});

		const wrapper = mount(PagePreview, {
			props: {
				width: 100,
				height: 100,
				shapes: [],
				texts: [text],
			},
		});

		const node = wrapper.find('text tspan');

		expect(node.attributes('stroke')).toBe('#ff0000');
		expect(node.attributes('stroke-width')).toBe('2');
		expect(node.attributes('stroke-linejoin')).toBe('round');
		expect(node.attributes('paint-order')).toBe('stroke fill');
	});

	it('renders character-level styles on tspans', () => {
		const text = TextBlock.create(5, 5);

		text.applyPatch({
			content: 'Ab',
			styles: {
				'0': {
					'0': { fontWeight: 'bold', fill: '#ff0000' },
					'1': { fontStyle: 'italic', underline: true },
				},
			},
		});

		const wrapper = mount(PagePreview, {
			props: {
				width: 100,
				height: 100,
				shapes: [],
				texts: [text],
			},
		});
		const tspans = wrapper.findAll('text tspan');

		expect(tspans).toHaveLength(2);
		expect(tspans[0]?.text()).toContain('A');
		expect(tspans[0]?.attributes('font-weight')).toBe('bold');
		expect(tspans[0]?.attributes('fill')).toBe('#ff0000');
		expect(tspans[1]?.text()).toContain('b');
		expect(tspans[1]?.attributes('font-style')).toBe('italic');
		expect(tspans[1]?.attributes('text-decoration')).toBe('underline');
	});
});
