import { EW_VECTOR, WE_VECTOR } from '../lib/game/constants'
import { BallRecord } from '../lib/game/schema/BallRecord'
import { IPlayer } from '../lib/game/schema/PlayerRecord'

export function spawnBall(player: IPlayer) {
	const { state, position, team } = player

	if (state.name !== 'aiming') throw Error('Player is not aiming')

	const power = state.power

	const ball = BallRecord.create({
		created_by: player.id,
		position: { x: position.x, y: position.y },
		velocity: team === 'green' ? WE_VECTOR : EW_VECTOR,
		team,
		power,
		fullPower: power === 1,
	})

	return ball
}
