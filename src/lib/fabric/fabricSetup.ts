import {
	Control,
	FabricObject,
	controlsUtils,
	util,
	type ControlRenderingStyleOverride,
} from 'fabric';
import { ACCENT_COLOR } from '@/lib/fabric/fabricColors';

const ROTATE_ICON_SIZE = 30;
const ROTATE_OFFSET_Y = 44;

const renderRotateIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, _styleOverride: ControlRenderingStyleOverride, fabricObject: FabricObject) => {
	const size = ROTATE_ICON_SIZE;
	const radius = size * 0.22;

	ctx.save();
	ctx.translate(left, top);
	ctx.rotate(util.degreesToRadians(fabricObject.angle ?? 0));

	ctx.beginPath();
	ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
	ctx.fillStyle = ACCENT_COLOR;
	ctx.fill();

	ctx.beginPath();
	ctx.arc(0, 0, radius, -Math.PI * 0.85, Math.PI * 0.7);
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	ctx.lineCap = 'round';
	ctx.stroke();

	const tipAngle = Math.PI * 0.7;
	const tipX = radius * Math.cos(tipAngle);
	const tipY = radius * Math.sin(tipAngle);

	ctx.beginPath();
	ctx.moveTo(tipX, tipY);
	ctx.lineTo(tipX - 4.5, tipY - 0.6);
	ctx.lineTo(tipX - 0.6, tipY + 4.5);
	ctx.closePath();
	ctx.fillStyle = '#ffffff';
	ctx.fill();

	ctx.restore();
};

const createBottomRotateControl = (): Control => {
	return new Control({
		x: 0,
		y: 0.5,
		offsetY: ROTATE_OFFSET_Y,
		cursorStyleHandler: controlsUtils.rotationStyleHandler,
		actionHandler: controlsUtils.rotationWithSnapping,
		actionName: 'rotate',
		withConnection: true,
		sizeX: ROTATE_ICON_SIZE,
		sizeY: ROTATE_ICON_SIZE,
		touchSizeX: ROTATE_ICON_SIZE + 8,
		touchSizeY: ROTATE_ICON_SIZE + 8,
		render: renderRotateIcon,
	});
};

export const setupFabricCustomProperties = () => {
	FabricObject.customProperties = ['objectType', 'panelId'];
	FabricObject.ownDefaults.borderColor = ACCENT_COLOR;
	FabricObject.ownDefaults.cornerColor = ACCENT_COLOR;
	FabricObject.ownDefaults.cornerStrokeColor = ACCENT_COLOR;
	FabricObject.ownDefaults.transparentCorners = false;

	FabricObject.createControls = () => {
		const controls = controlsUtils.createObjectDefaultControls();

		controls.mtr = createBottomRotateControl();

		return { controls };
	};
};
