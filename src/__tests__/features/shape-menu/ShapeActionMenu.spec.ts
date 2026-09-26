import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ShapeActionMenu from '@/features/shape-menu/components/ShapeActionMenu.vue';

const props = {
	hasImage: false,
	isGrayscale: false,
	isFlipX: false,
	isFlipY: false,
	fill: null,
	strokes: [],
	left: 40,
	top: 20,
	placement: 'below' as const,
};

describe('ShapeActionMenu', () => {
	it('emits showOptions from the element options button', async () => {
		const wrapper = mount(ShapeActionMenu, {
			props,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Show element options"]').trigger('click');

		expect(wrapper.emitted('showOptions')).toHaveLength(1);
		wrapper.unmount();
	});

	it('toggles the fill and emits preview/final fill colors', async () => {
		const wrapper = mount(ShapeActionMenu, {
			props,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const toggle = wrapper.get('button[aria-label="Fill panel"]');

		expect(toggle.attributes('aria-pressed')).toBe('false');

		await toggle.trigger('click');

		expect(wrapper.emitted('toggleFill')).toHaveLength(1);

		const input = wrapper.get('input[aria-label="Fill color"]');

		await input.setValue('#ff0000');

		expect(wrapper.emitted('previewFillColor')).toEqual([['#ff0000']]);
		expect(wrapper.emitted('setFillColor')).toEqual([['#ff0000']]);

		await wrapper.setProps({ fill: '#ff0000' });

		expect(
			wrapper.get('button[aria-label="Remove fill"]').attributes('aria-pressed'),
		).toBe('true');
		wrapper.unmount();
	});

	it('groups fill, edges and image in that order', async () => {
		const wrapper = mount(ShapeActionMenu, {
			props: {
				...props,
				hasImage: true,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});
		const labels = wrapper.findAll('[aria-label]').map((node) => {
			return node.attributes('aria-label');
		});

		expect(labels.indexOf('Fill')).toBeLessThan(labels.indexOf('Edge strokes'));
		expect(labels.indexOf('Edge strokes')).toBeLessThan(labels.indexOf('Image'));
		expect(labels.indexOf('Fill panel')).toBeLessThan(
			labels.indexOf('Fill color'),
		);
		expect(labels.indexOf('Add image')).toBe(-1);
		expect(labels.indexOf('Replace image')).toBeGreaterThan(
			labels.indexOf('Image'),
		);
		expect(labels.indexOf('Black and white')).toBeGreaterThan(
			labels.indexOf('Replace image'),
		);
		expect(labels.indexOf('Show element options')).toBeGreaterThan(
			labels.indexOf('Remove image'),
		);

		await wrapper.setProps({ hasImage: false });

		const withoutImage = wrapper.findAll('[aria-label]').map((node) => {
			return node.attributes('aria-label');
		});

		expect(withoutImage.indexOf('Add image')).toBeGreaterThan(
			withoutImage.indexOf('Image'),
		);
		expect(withoutImage).not.toContain('Black and white');
		wrapper.unmount();
	});
});
