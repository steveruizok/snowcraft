import { Vec } from '../lib/Vec'
import { EW_VECTOR, WE_VECTOR } from '../lib/game/constants'
import { IPlayer } from '../lib/game/schema/PlayerRecord'
import { getRandomPosition } from './getRandomPosition'

export function getAiPlayerAction(player: IPlayer, players: IPlayer[]): IPlayer {
	let event: string
	const r = Math.random()
	if (r < 0.15) event = 'wait'
	else if (r < 0.5) event = 'move'
	else event = 'throw'

	let isSomeoneInFront = false

	for (const otherPlayer of players) {
		if (otherPlayer.team === player.team) continue
		const vector = Vec.Sub(otherPlayer.position, player.position).uni()
		const cpr = Vec.Cpr(vector, player.team === 'green' ? EW_VECTOR : WE_VECTOR)
		if (cpr > -0.35 && cpr < 0.35) {
			isSomeoneInFront = true
			break
		}
	}

	if (!isSomeoneInFront && event === 'throw') {
		event = 'move'
	}

	if (player.state.name === 'moving' && event === 'move') {
		event = 'wait'
	}

	switch (event) {
		case 'move': {
			// Pick a new location and move to it
			const destination = getRandomPosition(player)
			return {
				...player,
				state: {
					name: 'moving',
					ai: true,
					// move kinda towards that destination
					to: Vec.Add(
						player.position,
						Vec.Sub(destination, player.position)
							.uni()
							.mul(Math.min(50 + Math.random() * 50, Vec.Dist(destination, player.position)))
					).toJson(),
				},
			}
		}
		case 'wait': {
			// Do nothing, wait a little longer
			return {
				...player,
				state: {
					name: 'waiting',
					ai: true,
					// Wait for between 500 and 1500ms
					duration: 500 + 1000 * Math.random(),
				},
			}
		}
		case 'throw': {
			// Throw a snowball!
			return {
				...player,
				state: {
					name: 'aiming',
					power: 0,
					// ai's throw full power 1/3rd of the time, and never less than .93
					maxPower: Math.min(1, 1 - Math.random() * 0.07),
				},
			}
		}
		default: {
			throw Error('Not handled!')
		}
	}
}
