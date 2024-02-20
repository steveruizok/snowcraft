import { Box } from '../lib/Box'
import { Vec } from '../lib/Vec'
import { BORDER_VECTOR, PLAYER_SIZE } from '../lib/game/constants'
import { IPlayer } from '../lib/game/schema/PlayerRecord'
import { clampPosition } from './clampPosition'

const PI2 = Math.PI * 2

export function getRandomPosition(player: IPlayer, screenSize?: Box): Vec {
	const position = clampPosition(
		player,
		new Vec(1, 1).rot(Math.random() * PI2).mul(100 + Math.random() * 150)
	)

	const pointOnBorder = Vec.NearestPointOnLineThroughPoint(
		player.team === 'green' ? new Vec(-10, -10) : new Vec(10, 10),
		BORDER_VECTOR,
		position
	)

	if (
		(player.team === 'green' && pointOnBorder.x < position.x) ||
		(player.team === 'red' && pointOnBorder.x > position.x) ||
		(screenSize &&
			(player.position.x < -(screenSize.w / 2) + PLAYER_SIZE ||
				player.position.x > screenSize.w / 2 - PLAYER_SIZE ||
				player.position.y < -(screenSize.h / 2) + PLAYER_SIZE ||
				player.position.y > screenSize.h / 2 - PLAYER_SIZE))
	) {
		return getRandomPosition(player)
	}

	return position
}
