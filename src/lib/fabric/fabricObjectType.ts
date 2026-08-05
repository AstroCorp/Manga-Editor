import type { FabricObjectType } from '@/types/fabric';

export const FABRIC_OBJECT_TYPE = {
	Panel: 'panel',
	PanelImage: 'panelImage',
	Text: 'text',
} as const satisfies Record<string, FabricObjectType>;
