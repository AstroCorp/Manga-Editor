import type { CanvasFeature } from '@/features/types';
import { usePageText } from '@/features/text/usePageText';

export const textFeature: CanvasFeature = {
	install(ctx) {
		const api = usePageText(ctx);

		ctx.registerCanvasAction({
			addSimpleText: api.addSimpleText,
		});
	},
};
