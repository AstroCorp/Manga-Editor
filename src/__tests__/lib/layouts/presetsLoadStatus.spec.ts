import { describe, expect, it } from 'vitest';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';

describe('PRESETS_LOAD_STATUS', () => {
	it('names the preset catalog states', () => {
		expect(PRESETS_LOAD_STATUS).toEqual({
			Idle: 'idle',
			Loading: 'loading',
			Ready: 'ready',
		});
	});
});
