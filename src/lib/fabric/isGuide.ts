import type { FabricObject } from 'fabric';
import type { GuideMarkedObject } from '@/types/fabric';

export const isGuide = (object: FabricObject): boolean => {
	const marked = object as GuideMarkedObject;

	return Boolean(marked.isGuide || object.get('isGuide'));
};
