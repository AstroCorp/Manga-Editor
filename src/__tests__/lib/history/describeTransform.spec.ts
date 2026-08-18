import { describe, expect, it } from 'vitest';
import { HISTORY_LABEL } from '@/lib/history/historyEnums';
import {
	describeTransform,
	transformHistoryLabel,
} from '@/lib/history/describeTransform';

describe('describeTransform', () => {
	it('prefers rotate when the angle changes even if the object also moved', () => {
		expect(
			describeTransform(
				{ left: 10, top: 10, angle: 0, scaleX: 1, scaleY: 1 },
				{ left: 14, top: 8, angle: 22.5, scaleX: 1, scaleY: 1 },
			),
		).toBe('rotate');
	});

	it('detects scale from scale factors or text width', () => {
		expect(
			describeTransform(
				{ left: 10, top: 10, scaleX: 1, scaleY: 1 },
				{ left: 10, top: 10, scaleX: 1.4, scaleY: 1.4 },
			),
		).toBe('scale');
		expect(
			describeTransform(
				{ left: 10, top: 10, width: 200 },
				{ left: 10, top: 10, width: 260 },
			),
		).toBe('scale');
	});

	it('detects wrapped rotation and ignores tiny angle jitter', () => {
		expect(
			describeTransform(
				{ left: 10, top: 10, angle: 359 },
				{ left: 10, top: 10, angle: 2 },
			),
		).toBe('rotate');
		expect(
			describeTransform(
				{ left: 10, top: 10, angle: 0 },
				{ left: 12, top: 10, angle: 0.2 },
			),
		).toBe('move');
	});

	it('maps transform kinds to history actions', () => {
		expect(transformHistoryLabel('rotate', 'text')).toBe(
			HISTORY_LABEL.RotateText,
		);
		expect(transformHistoryLabel('rotate', 'image')).toBe(
			HISTORY_LABEL.RotateImage,
		);
		expect(transformHistoryLabel('scale', 'text')).toBe(
			HISTORY_LABEL.ScaleText,
		);
		expect(transformHistoryLabel('scale', 'image')).toBe(
			HISTORY_LABEL.ScaleImage,
		);
		expect(transformHistoryLabel('move', 'text')).toBe(HISTORY_LABEL.MoveText);
		expect(transformHistoryLabel('move', 'image')).toBe(
			HISTORY_LABEL.MoveImage,
		);
	});
});
