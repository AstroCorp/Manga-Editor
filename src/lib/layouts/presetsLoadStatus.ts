import type { PresetsLoadStatus } from '@/types/layouts';

export const PRESETS_LOAD_STATUS = {
	Idle: 'idle',
	Loading: 'loading',
	Ready: 'ready',
} as const satisfies Record<string, PresetsLoadStatus>;
