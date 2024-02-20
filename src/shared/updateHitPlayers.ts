import { IBall } from '../lib/game/schema/BallRecord'
import { IPlayer } from '../lib/game/schema/PlayerRecord'

export function updateHitPlayers(player: IPlayer, _ball: IBall) {
	const health = player.health - 1 / 8

	let nextPlayer: IPlayer

	if (health <= 1 / 8) {
		// rip
		nextPlayer = {
			...player,
			health,
			state: { name: 'dead', recovery: 8 },
		}
	} else {
		// Hit the player
		nextPlayer = {
			...player,
			state: { name: 'hit', recovery: 2 },
			health,
			// position: Vec.Add(player.position, Vec.Mul(Vec.Uni(ball.velocity), 10)).toJson(),
		}
	}

	return nextPlayer
}
