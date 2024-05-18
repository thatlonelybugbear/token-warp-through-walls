import Settings from './settings.js';

const settings = new Settings();

/*  Functions */
export function _preUpdateToken(tdoc, changes, options, userId) {
	if ((changes.x || changes.y) && options.animate !== false) {
		const ev = event;
		const keyTW =
			/*game.keybindings.get('tokenwarp', 'teleport')?.[0].key || */ 'KeyQ';
		const keyER = getElevationRulerKey();
		const hasKey =
			isKeyPressed(ev, keyER) || isKeyPressed(ev, keyTW);
		const ruler = canvas.controls.ruler;
		const { segments } = ruler;
		const { size: gridSize, distance: gridDistance } = canvas.scene.grid || {};
		const finalSegment = segments?.at(-1);
		const rect = canvas.scene.dimensions.sceneRect;
		const destination = finalSegment
			? { x: finalSegment.ray.B.x, y: finalSegment.ray.B.y }
			: { x: changes.x ?? tdoc.x, y: changes.y ?? tdoc.y };
		const isRulerMoving = ruler._state === Ruler.STATES.MOVING;
		if (
			isRulerMoving &&
			(hasKey ||
				(!settings.excludedScene &&
					(settings.movementSwitch ||
						(game.users.get(userId).isGM &&
							settings.wallBlock &&
							_wallsBlockMovement(tdoc, segments)) || destinationOutOfBounds(destination, rect, gridSize, tdoc)
						)))
		) {
			let elevation;
			let update = {};
			if (segments?.length) {
				update = getAdjustedDestination(tdoc, segments, hasKey);
				elevation = finalSegment.waypointElevationIncrement
					? tdoc.elevation + Math.round((finalSegment.waypointElevationIncrement * gridDistance) / gridSize)
					: tdoc.elevation;
				update.elevation = elevation;
			} else {
				update = getAdjustedDestination(tdoc, /*segments ??*/ destination, hasKey);
			}
			tdoc.update(update, { animate: false, animation: {} });
			return false;
		}
		if (settings.movementSpeed)
			foundry.utils.setProperty(
				options,
				'animation.movementSpeed',
				settings.movementSpeed
			);
		if (destinationOutOfBounds(destination, rect, gridSize, tdoc))
			 {
				const update = clampDestinationToSceneRect(destination, tdoc);
				changes.x = update.x;
				changes.y = update.y;
			 }
		return true;
	}
}

function _wallsBlockMovement(tdoc, segments) {
	if (!segments?.length) return false;
	for (const segment of segments) {
		if (tdoc.object.checkCollision(segment.ray.B, { origin: segment.ray.A })) {
			return true;
		}
	}
	return false;
}

function getAdjustedDestination(tdoc, segments, hasKey) {
	const rect = canvas.scene.dimensions.sceneRect;
	const {size, type} = canvas.scene.grid;
	const origin = segments.length ? segments[0].ray.A : { x: tdoc.x, y: tdoc.y };
	const destination = segments.length ? segments.at(-1).ray.B : segments;
	const s2 =
		type === CONST.GRID_TYPES.GRIDLESS
			? 1
			: size / 2;
	const dx = Math.round((tdoc.x - origin.x) / s2) * s2;
	const dy = Math.round((tdoc.y - origin.y) / s2) * s2;
	const r = new Ray(origin, destination);
	const adjustedDestination = canvas.grid.grid._getRulerDestination(
		r,
		{ x: dx, y: dy },
		tdoc.object
	);
	if (hasKey) return adjustedDestination;
	else
		return {
			x: Math.clamped(
				adjustedDestination.x,
				rect.x,
				rect.x +
					rect.width -
					size * tdoc.width
			),
			y: Math.clamped(
				adjustedDestination.y,
				rect.y,
				rect.y +
					rect.height -
					size * tdoc.height
			),
		};
}

function getElevationRulerKey() {
    return game.modules.get('elevationruler')?.active
        ? game.keybindings.get('elevationruler', 'togglePathfinding')[0].key
        : null;
}

function isKeyPressed(ev, key) {
    return ev?.view?.game.keyboard.downKeys.has(key);
}

function getDestinationFromSegment(segment) {
    return { x: segment.ray.B.x, y: segment.ray.B.y };
}

function destinationOutOfBounds(destination, rect, gridSize, tdoc) {
    return (
        rect.x > destination.x ||
        rect.x + rect.width - gridSize * tdoc.width < destination.x ||
        rect.y > destination.y ||
        rect.y + rect.height - gridSize * tdoc.height < destination.y
    );
}

function clampDestinationToSceneRect(destination, tdoc) {
    const rect = canvas.scene.dimensions.sceneRect;
	const gridSize = canvas.scene.grid.size;
    return {
	    x: Math.clamped(
	        destination.x,
	        rect.x,
	        rect.x + rect.width - gridSize * tdoc.width
	    ),
	    y: Math.clamped(
	        destination.y,
	        rect.y,
	        rect.y + rect.height - gridSize * tdoc.height
	    )
	};
}
