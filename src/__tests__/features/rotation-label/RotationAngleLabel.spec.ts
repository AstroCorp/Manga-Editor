import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RotationAngleLabel from '@/features/rotation-label/components/RotationAngleLabel.vue';

describe('RotationAngleLabel', () => {
	it('hides when angle or position is missing', () => {
		const hiddenAngle = mount(RotationAngleLabel, {
			props: { angle: null, left: 10, top: 10 },
		});
		const hiddenPosition = mount(RotationAngleLabel, {
			props: { angle: 45, left: null, top: 10 },
		});

		expect(hiddenAngle.find('div').exists()).toBe(false);
		expect(hiddenPosition.find('div').exists()).toBe(false);
	});

	it('renders the formatted angle at the overlay position', () => {
		const wrapper = mount(RotationAngleLabel, {
			props: { angle: 22.5, left: 40, top: 80 },
		});

		expect(wrapper.text()).toBe('22.5°');
		expect(wrapper.get('div').attributes('style')).toContain('left: 40px');
		expect(wrapper.get('div').attributes('style')).toContain('top: 80px');
	});
});
