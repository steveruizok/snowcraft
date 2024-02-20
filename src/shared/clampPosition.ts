import { Vec, VecModel } from '../lib/Vec'
import { BORDER_VECTOR } from '../lib/game/constants'
import { IPlayer } from '../lib/game/schema/PlayerRecord'

export function clampPosition(player: IPlayer, position: VecModel): Vec {
	// Prevent the user from moving past the border
	if (player.team === 'green') {
		const pointOnBorder = Vec.NearestPointOnLineThroughPoint(
			new Vec(-10, -10),
			BORDER_VECTOR,
			position
		)
		if (pointOnBorder.x < position.x) {
			position = pointOnBorder
		}
	} else if (player.team === 'red') {
		const pointOnBorder = Vec.NearestPointOnLineThroughPoint(
			new Vec(10, 10),
			BORDER_VECTOR,
			position
		)
		if (pointOnBorder.x > position.x) {
			position = pointOnBorder
		}
	}

	// Keep the player 400px from the center
	if (Vec.Len(position) > 400) {
		position = Vec.Mul(Vec.Uni(position), 400)
	}

	return Vec.Cast(position)
}
