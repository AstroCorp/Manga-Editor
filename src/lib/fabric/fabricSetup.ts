import { FabricObject } from 'fabric';
import { ACCENT_COLOR } from '@/lib/fabric/fabricColors';

export const setupFabricCustomProperties = () => {
	FabricObject.customProperties = ['objectType', 'panelId'];
	FabricObject.ownDefaults.borderColor = ACCENT_COLOR;
	FabricObject.ownDefaults.cornerColor = ACCENT_COLOR;
	FabricObject.ownDefaults.cornerStrokeColor = ACCENT_COLOR;
	FabricObject.ownDefaults.transparentCorners = false;
};
