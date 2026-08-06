import { describe, expect, it, vi } from 'vitest';
import {
	NUDGE_REPEAT_STEP_PX,
	NUDGE_STEP_PX,
	nudgeDeltaForArrowKey,
	nudgeFabricObject,
} from '@/lib/fabric/nudgeObject';

describe('nudgeObject', () => {
	it('maps arrow keys to 1px deltas', () => {
		expect(nudgeDeltaForArrowKey('ArrowLeft')).toEqual({
			dx: -NUDGE_STEP_PX,
			dy: 0,
		});
		expect(nudgeDeltaForArrowKey('ArrowRight')).toEqual({
			dx: NUDGE_STEP_PX,
			dy: 0,
		});
		expect(nudgeDeltaForArrowKey('ArrowUp')).toEqual({
			dx: 0,
			dy: -NUDGE_STEP_PX,
		});
		expect(nudgeDeltaForArrowKey('ArrowDown')).toEqual({
			dx: 0,
			dy: NUDGE_STEP_PX,
		});
		expect(nudgeDeltaForArrowKey('a')).toBeNull();
	});

	it('uses a larger step while the key is repeating', () => {
		expect(nudgeDeltaForArrowKey('ArrowRight', true)).toEqual({
			dx: NUDGE_REPEAT_STEP_PX,
			dy: 0,
		});
	});

	it('nudges left/top and refreshes coords', () => {
		const object = {
			left: 10,
			top: 20,
			set: vi.fn(function set(
				this: { left: number; top: number },
				props: { left: number; top: number },
			) {
				this.left = props.left;
				this.top = props.top;
			}),
			setCoords: vi.fn(),
		};

		nudgeFabricObject(object as never, { dx: 1, dy: -1 });

		expect(object.set).toHaveBeenCalledWith({ left: 11, top: 19 });
		expect(object.setCoords).toHaveBeenCalled();
	});
});
