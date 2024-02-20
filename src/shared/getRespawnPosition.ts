import { Box } from '../lib/Box'
import { Vec } from '../lib/Vec'
import { BORDER_VECTOR, PLAYER_SIZE } from '../lib/game/constants'
import { IPlayer } from '../lib/game/schema/PlayerRecord'

export function getRespawnPosition(player: IPlayer, screenSize?: Box): Vec {
	const position =
		player.team === 'green'
			? new Vec(-200, -100).add(
					new Vec(-1, -0.5).rot(-0.2 + Math.random() * 0.4).mul(25 + Math.random() * 20)
				)
			: new Vec(200, 100).add(
					new Vec(1, 0.5).rot(-0.2 + Math.random() * 0.4).mul(25 + Math.random() * 20)
				)

	if (screenSize) {
		position.x = Math.max(position.x, -(screenSize.w / 2) + PLAYER_SIZE)
		position.x = Math.min(position.x, screenSize.w / 2 - PLAYER_SIZE)
		position.y = Math.max(position.y, -(screenSize.h / 2) + PLAYER_SIZE)
		position.y = Math.min(position.y, screenSize.h / 2 - PLAYER_SIZE)
	}

	const pointOnBorder = Vec.NearestPointOnLineThroughPoint(
		player.team === 'green' ? new Vec(-10, -10) : new Vec(10, 10),
		BORDER_VECTOR,
		position
	)

	if (Vec.Dist(position, pointOnBorder) < 10) {
		return getRespawnPosition(player, screenSize)
	}

	return position
}
