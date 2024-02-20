import { Vec, VecModel } from '../lib/Vec'
import { PLAYER_SIZE } from '../lib/game/constants'
import { IBall } from '../lib/game/schema/BallRecord'
import { IPlayer } from '../lib/game/schema/PlayerRecord'

export function getSnowballHits(balls: Map<IBall, [VecModel, VecModel]>, players: IPlayer[]) {
	const hits = new Map<IBall, IPlayer>()

	for (const [ball, [a, b]] of balls) {
		for (const player of players) {
			if (
				player.team === ball.team ||
				player.state.name === 'hit' ||
				player.state.name === 'dead' ||
				ball.power < 0.5
			) {
				continue
			}

			// Did the ball pass near enough to the player this turn?
			const dist = Vec.DistanceToLineSegment(a, b, player.position, true)
			if (dist < PLAYER_SIZE / 2.5) {
				hits.set(ball, player)
				break // only hit one player
			}

			// no hit!
			continue
		}
	}

	return hits
}
