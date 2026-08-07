<script setup lang="ts">
import { computed, useId } from 'vue';
import { PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import { buildPagePreview } from '@/lib/page/pagePreview';
import type { Shape } from '@/models/Shape';
import type { TextBlock } from '@/models/TextBlock';
import type { PagePreviewText, ShapeJSON } from '@/types/page';

const props = withDefaults(
	defineProps<{
		width: number;
		height: number;
		shapes?: Array<Shape | ShapeJSON> | null;
		texts?: TextBlock[] | null;
	}>(),
	{
		shapes: null,
		texts: null,
	},
);

const previewId = useId();

const model = computed(() => {
	return buildPagePreview(props.width, props.height, props.shapes, props.texts);
});

const filledPanels = computed(() => {
	return model.value.panels.filter((panel) => {
		return panel.whiteFill;
	});
});

const rotateTransform = (angle: number, originX: number, originY: number) => {
	if (!angle) {
		return undefined;
	}

	return `rotate(${angle} ${originX} ${originY})`;
};

const clipPathId = (index: number) => {
	return `${previewId}-img-clip-${index}`;
};

const textAnchorX = (text: PagePreviewText) => {
	if (text.textAlign === 'center' || text.textAlign === 'justify-center') {
		return text.originX + text.width / 2;
	}

	if (text.textAlign === 'right' || text.textAlign === 'justify-right') {
		return text.originX + text.width;
	}

	return text.x;
};

const textAnchor = (text: PagePreviewText) => {
	if (text.textAlign === 'center' || text.textAlign === 'justify-center') {
		return 'middle';
	}

	if (text.textAlign === 'right' || text.textAlign === 'justify-right') {
		return 'end';
	}

	return 'start';
};

const lineDy = (text: PagePreviewText, lineIndex: number) => {
	if (lineIndex === 0) {
		return undefined;
	}

	return text.fontSize * text.lineHeight;
};

/** Línea vacía: NBSP para que el dy del tspan se aplique en SVG. */
const lineContent = (line: string) => {
	return line.length > 0 ? line : '\u00A0';
};
</script>

<template>
	<svg
		class="block h-full w-full bg-white dark:bg-zinc-100"
		:viewBox="`0 0 ${model.width} ${model.height}`"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-hidden="true"
	>
		<defs>
			<clipPath
				v-for="(image, index) in model.images"
				:id="clipPathId(index)"
				:key="`clip-${index}`"
			>
				<polygon :points="image.clipPoints" />
			</clipPath>
		</defs>
		<rect :width="model.width" :height="model.height" fill="#ffffff" />
		<!-- fill → image (clip forma) → stroke -->
		<polygon
			v-for="(panel, index) in filledPanels"
			:key="`fill-${index}`"
			:points="panel.points"
			fill="#ffffff"
			stroke="none"
		/>
		<g
			v-for="(image, index) in model.images"
			:key="`img-${index}`"
			:clip-path="`url(#${clipPathId(index)})`"
		>
			<image
				:href="image.href"
				:x="image.x"
				:y="image.y"
				:width="image.width"
				:height="image.height"
				:transform="rotateTransform(image.angle, image.originX, image.originY)"
				:style="image.grayscale ? { filter: 'grayscale(1)' } : undefined"
				preserveAspectRatio="xMidYMid slice"
			/>
		</g>
		<polygon
			v-for="(panel, index) in model.panels"
			:key="`stroke-${index}`"
			:points="panel.points"
			fill="none"
			:stroke="PANEL_STROKE_COLOR"
			:stroke-width="panel.strokeWidth"
			stroke-linejoin="miter"
		/>
		<text
			v-for="(text, index) in model.texts"
			:key="`text-${index}`"
			:x="textAnchorX(text)"
			:y="text.y"
			:font-size="text.fontSize"
			:fill="text.fill"
			:stroke="text.strokeWidth > 0 ? text.stroke ?? undefined : undefined"
			:stroke-width="text.strokeWidth > 0 ? text.strokeWidth : undefined"
			stroke-linejoin="round"
			stroke-linecap="round"
			paint-order="stroke fill"
			:font-weight="text.fontWeight"
			:font-style="text.fontStyle"
			:text-anchor="textAnchor(text)"
			:text-decoration="
				[text.underline ? 'underline' : '', text.linethrough ? 'line-through' : '']
					.filter(Boolean)
					.join(' ') || undefined
			"
			:transform="rotateTransform(text.angle, text.originX, text.originY)"
			:font-family="text.fontFamily"
			xml:space="preserve"
		>
			<tspan
				v-for="(line, lineIndex) in text.lines"
				:key="`line-${lineIndex}`"
				:x="textAnchorX(text)"
				:dy="lineDy(text, lineIndex)"
			>
				{{ lineContent(line) }}
			</tspan>
		</text>
	</svg>
</template>
