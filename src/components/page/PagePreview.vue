<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import { ensureTextFontsLoaded } from '@/lib/fonts/loadGoogleFont';
import { buildPagePreview } from '@/lib/page/pagePreview';
import type { Shape } from '@/models/Shape';
import type { TextBlock } from '@/models/TextBlock';
import type {
	PagePreviewText,
	PagePreviewTextRun,
	ShapeJSON,
} from '@/types/page';

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
const fontEpoch = ref(0);

watch(
	() => props.texts,
	(texts) => {
		void Promise.all(
			(texts ?? []).map((text) => {
				return ensureTextFontsLoaded(text);
			}),
		).then(() => {
			fontEpoch.value += 1;
		});
	},
	{ immediate: true, deep: true },
);

const model = computed(() => {
	void fontEpoch.value;

	return buildPagePreview(props.width, props.height, props.shapes, props.texts);
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
		return text.x + text.width / 2;
	}

	if (text.textAlign === 'right' || text.textAlign === 'justify-right') {
		return text.x + text.width;
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
const runContent = (run: PagePreviewTextRun) => {
	return run.text.length > 0 ? run.text : '\u00A0';
};

const runDecoration = (run: PagePreviewTextRun) => {
	return (
		[
			run.underline ? 'underline' : '',
			run.linethrough ? 'line-through' : '',
		]
			.filter(Boolean)
			.join(' ') || undefined
	);
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
			<template
				v-for="(panel, index) in model.panels"
				:key="`clip-${index}`"
			>
				<clipPath v-if="panel.image" :id="clipPathId(index)">
					<polygon :points="panel.points" />
				</clipPath>
			</template>
		</defs>
		<rect :width="model.width" :height="model.height" fill="#ffffff" />
		<!-- Por panel (como el canvas): fill → imagen → borde; textos encima. -->
		<template
			v-for="(panel, index) in model.panels"
			:key="`panel-${index}`"
		>
			<polygon
				v-if="panel.whiteFill"
				:points="panel.points"
				fill="#ffffff"
				stroke="none"
			/>
			<g
				v-if="panel.image"
				:clip-path="`url(#${clipPathId(index)})`"
			>
				<image
					:href="panel.image.href"
					:x="panel.image.x"
					:y="panel.image.y"
					:width="panel.image.width"
					:height="panel.image.height"
					:transform="
						rotateTransform(
							panel.image.angle,
							panel.image.originX,
							panel.image.originY,
						)
					"
					:style="
						panel.image.grayscale ? { filter: 'grayscale(1)' } : undefined
					"
					preserveAspectRatio="xMidYMid slice"
				/>
			</g>
			<polygon
				:points="panel.points"
				fill="none"
				:stroke="PANEL_STROKE_COLOR"
				:stroke-width="panel.strokeWidth"
				stroke-linejoin="miter"
			/>
		</template>
		<template v-for="(text, index) in model.texts" :key="`text-${index}`">
			<rect
				v-if="text.box"
				:x="text.originX"
				:y="text.originY"
				:width="text.boxWidth ?? text.width + text.box.padding * 2"
				:height="
					text.boxHeight ??
					text.lines.length * text.fontSize * text.lineHeight +
						text.box.padding * 2
				"
				:rx="text.box.cornerRadius"
				:ry="text.box.cornerRadius"
				:fill="text.box.fill"
				:stroke="text.box.stroke"
				:stroke-width="text.box.strokeWidth"
				:transform="rotateTransform(text.angle, text.originX, text.originY)"
			/>
			<text
				:x="textAnchorX(text)"
				:y="text.y"
				:text-anchor="textAnchor(text)"
				:transform="rotateTransform(text.angle, text.originX, text.originY)"
				xml:space="preserve"
			>
				<template
					v-for="(lineRuns, lineIndex) in text.lines"
					:key="`line-${lineIndex}`"
				>
					<tspan
						v-for="(run, runIndex) in lineRuns"
						:key="`run-${lineIndex}-${runIndex}`"
						:x="runIndex === 0 ? textAnchorX(text) : undefined"
						:dy="runIndex === 0 ? lineDy(text, lineIndex) : undefined"
						:font-size="run.fontSize"
						:fill="run.fill"
						:stroke="run.strokeWidth > 0 ? run.stroke ?? undefined : undefined"
						:stroke-width="run.strokeWidth > 0 ? run.strokeWidth : undefined"
						stroke-linejoin="round"
						stroke-linecap="round"
						paint-order="stroke fill"
						:font-weight="run.fontWeight"
						:font-style="run.fontStyle"
						:text-decoration="runDecoration(run)"
						:font-family="run.fontFamily"
					>
						{{ runContent(run) }}
					</tspan>
				</template>
			</text>
		</template>
	</svg>
</template>
