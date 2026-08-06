import { describe, expect, it, vi } from 'vitest';
import { alignTextToPage } from '@/lib/fabric/pageAlign';

const createTextbox = (bounds: {
	left: number;
	top: number;
	width: number;
	height: number;
	objectLeft?: number;
	objectTop?: number;
}) => {
	const state = {
		left: bounds.objectLeft ?? bounds.left,
		top: bounds.objectTop ?? bounds.top,
	};

	return {
		get left() {
			return state.left;
		},
		get top() {
			return state.top;
		},
		set: vi.fn((props: { left: number; top: number }) => {
			state.left = props.left;
			state.top = props.top;
		}),
		setCoords: vi.fn(),
		getBoundingRect: () => {
			return {
				left: bounds.left + (state.left - (bounds.objectLeft ?? bounds.left)),
				top: bounds.top + (state.top - (bounds.objectTop ?? bounds.top)),
				width: bounds.width,
				height: bounds.height,
			};
		},
	};
};

describe('alignTextToPage', () => {
	const page = { width: 1000, height: 2000 };

	it('aligns to the nine page anchors using the AABB', () => {
		const textbox = createTextbox({
			left: 100,
			top: 200,
			width: 200,
			height: 100,
		});

		alignTextToPage(textbox, page, 'top-left');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 0, top: 0 });

		alignTextToPage(textbox, page, 'top-center');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 400, top: 0 });

		alignTextToPage(textbox, page, 'top-right');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 800, top: 0 });

		alignTextToPage(textbox, page, 'middle-left');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 0, top: 950 });

		alignTextToPage(textbox, page, 'middle-center');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 400, top: 950 });

		alignTextToPage(textbox, page, 'middle-right');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 800, top: 950 });

		alignTextToPage(textbox, page, 'bottom-left');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 0, top: 1900 });

		alignTextToPage(textbox, page, 'bottom-center');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 400, top: 1900 });

		alignTextToPage(textbox, page, 'bottom-right');
		expect(textbox.set).toHaveBeenLastCalledWith({ left: 800, top: 1900 });
	});

	it('preserves the object offset when bounds differ from left/top (rotation)', () => {
		const textbox = createTextbox({
			left: 50,
			top: 80,
			width: 120,
			height: 60,
			objectLeft: 70,
			objectTop: 90,
		});

		alignTextToPage(textbox, page, 'top-left');

		// delta = (0 - 50, 0 - 80) applied to object left/top
		expect(textbox.set).toHaveBeenCalledWith({ left: 20, top: 10 });
		expect(textbox.setCoords).toHaveBeenCalled();
	});
});
