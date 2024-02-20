import { Vec } from '../lib/Vec'
import { MOVEMENT_PER_FRAME } from '../lib/game/constants'
import { IPlayer } from '../lib/game/schema/PlayerRecord'
import { PointerState } from '../lib/game/types'
import { clampPosition } from './clampPosition'

export function getMovingUserPlayer(
	frames: number,
	player: IPlayer,
	pointer: PointerState & { name: 'dragging' }
): IPlayer {
	// Take into account the initial offset between the pointer and the player position
	const point = Vec.Sub(pointer.point, pointer.offset)
	const clampedPoint = clampPosition(player, point).toJson()

	// If the player is already there, skip
	if (Vec.Equals(clampedPoint, player.position)) {
		return player
	}

	const movementThisFrame = MOVEMENT_PER_FRAME * frames

	// If the player is close enough to the point, just snap to it
	if (Vec.Dist(point, player.position) <= movementThisFrame) {
		return { ...player, position: clampedPoint }
	}

	return {
		...player,
		position: clampPosition(
			player,
			Vec.Add(player.position, Vec.Mul(Vec.Sub(point, player.position).uni(), movementThisFrame))
		).toJson(),
	}
}
