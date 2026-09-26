import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ShapeActionMenu from '@/features/shape-menu/components/ShapeActionMenu.vue';

const props = {
	hasImage: false,
	isGrayscale: false,
	isFlipX: false,
	isFlipY: false,
	whiteFill: false,
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
});
