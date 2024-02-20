import { Box } from '../lib/Box'
import { Vec } from '../lib/Vec'
import {
	FRAME_LENGTH,
	MOVEMENT_PER_FRAME,
	TIME_TO_MAX_POWER,
	TIME_TO_RECOVER,
} from '../lib/game/constants'
import { IBall } from '../lib/game/schema/BallRecord'
import { IPlayer } from '../lib/game/schema/PlayerRecord'
import { getAiPlayerAction } from './getAiPlayerAction'
import { getRespawnPosition } from './getRespawnPosition'
import { spawnBall } from './spawnBall'

export function updatePlayer(
	frames: number,
	player: IPlayer,
	players: IPlayer[],
	context: { name: 'client'; playerId: IPlayer['id']; screenSize: Box } | { name: 'server' }
) {
	const { state } = player

	const isClient = context.name === 'client'
	const isClientUpdatingOwnPlayer = isClient && context.playerId === player.id

	const result: {
		player: IPlayer
		balls: IBall[]
		notes: string[]
		isPrivate: boolean
	} = {
		player,
		balls: [],
		notes: [],
		isPrivate: false,
	}

	switch (state.name) {
		case 'idle': {
			// noop
			break
		}
		case 'waiting': {
			if (!player.isAi) {
				player.state = { name: 'idle' }
				result.isPrivate = false
				console.error('User-controlled players should not be waiting')
				return result
			}

			switch (context.name) {
				case 'server': {
					const { duration } = state
					const nextDuration = duration - frames * FRAME_LENGTH

					if (nextDuration <= 0) {
						// start a new action
						result.player = getAiPlayerAction(player, players)
						result.isPrivate = false
					} else {
						result.player = {
							...player,
							state: { ...state, duration: nextDuration },
						}
						result.isPrivate = true
					}
				}
			}

			break
		}
		case 'moving': {
			const movementDistanceThisTick = player.speed * MOVEMENT_PER_FRAME * frames
			const distanceRemaining = Vec.Dist(state.to, player.position)

			if (!player.isAi) {
				player.state = { name: 'idle' }
				result.isPrivate = false
				console.error('User-controlled players should not be moving')
				return result
			}

			if (distanceRemaining <= movementDistanceThisTick) {
				result.player = {
					...result.player,
					position: state.to,
				}

				switch (context.name) {
					case 'client': {
						// On the client, just freeze the player
						result.isPrivate = true
						break
					}
					case 'server': {
						// On the server, tell the player to wait
						result.player = {
							...result.player,
							state: {
								name: 'waiting',
								duration: 200,
								ai: true,
							},
						}
						result.isPrivate = true
						break
					}
				}
			} else {
				// Move the AI player
				const nextPosition = Vec.Add(
					player.position,
					Vec.Mul(Vec.Sub(state.to, player.position).uni(), movementDistanceThisTick)
				).toJson()

				result.player = { ...result.player, position: nextPosition }
				result.isPrivate = true
			}

			break
		}
		case 'aiming': {
			// We should have already moved the player towards the pointer position
			const power = Math.min(1, state.power + (frames * FRAME_LENGTH) / TIME_TO_MAX_POWER)

			switch (context.name) {
				case 'client': {
					if (isClientUpdatingOwnPlayer) {
						// Update the user's power
						if (power !== state.power) {
							result.player = { ...result.player, state: { ...state, power } }
						}

						// By default this is private, but there's a chance that
						// the PLAYER_MOVED response may make this public if the
						// user is actually moving
						result.isPrivate = true
						result.notes.push('PLAYER_MOVED')
					}
					break
				}
				case 'server': {
					if (player.isAi) {
						// AI players don't move while aiming
						if (power >= state.maxPower) {
							// At max power, throw it!
							result.player = { ...result.player, state: { ...state, power: state.maxPower } }
							const ball = spawnBall(result.player)
							result.balls.push(ball)
							result.player = { ...result.player, state: { name: 'throwing', recovery: power } }
							result.isPrivate = false
						} else {
							// Keep charging the throw
							result.player = { ...result.player, state: { ...state, power } }
							result.isPrivate = true
						}
					} else {
						result.isPrivate = true
					}
					break
				}
			}

			break
		}
		case 'dead':
		case 'hit':
		case 'throwing': {
			const recovery = state.recovery - (frames * FRAME_LENGTH) / TIME_TO_RECOVER

			switch (context.name) {
				case 'client': {
					if (isClientUpdatingOwnPlayer) {
						if (recovery <= 0) {
							result.player = { ...player, state: { name: 'idle' } }

							if (state.name === 'dead') {
								result.player.position = getRespawnPosition(
									result.player,
									context.screenSize
								).toJson()
								result.player.health = 1
							}

							// We might need to change the player's state depending on
							// their inputs, i.e. put them back in the aiming state if they're
							// dragging the mouse when they recover
							result.notes.push('PLAYER_RECOVERED')

							// Transitioning back to idle is always public
							result.isPrivate = false
						} else {
							// Recovering is private though
							result.player = { ...player, state: { ...state, recovery } }
							result.isPrivate = true
						}
					} else {
						// For other playesr that are recovering on the client, we secretly
						// reduce the recovery time on the client; this might tell us whether
						// the server is saying that a player transitioned from a hit to a
						// move while they still had recovery left
						result.player = { ...player, state: { ...state, recovery } }
						result.isPrivate = true
					}

					break
				}
				case 'server': {
					if (player.isAi) {
						if (recovery <= 0) {
							// Transition to waiting for a few frames
							result.player = {
								...player,
								state: {
									name: 'waiting',
									duration: 200,
									ai: true,
								},
							}

							if (state.name === 'dead') {
								result.player.position = getRespawnPosition(result.player).toJson()
								result.player.health = 1
							}

							result.isPrivate = false
						} else {
							// Recovering is private though
							result.player = { ...player, state: { ...state, recovery } }
							result.isPrivate = true
						}
					}

					break
				}
			}
			break
		}
		default: {
			throw Error(`Unhandled state`)
		}
	}

	return result
}

// When recovered...
// // If the user is already clicking on the player, go to aiming
// const { pointer } = this.inputs
// if (pointer.name === 'dragging') {
// 	pointer.downPoint = Vec.From(player.position)
// 	pointer.offset = Vec.Sub(pointer.downPoint, player.position)

// 	result.player = {
// 		position,
// 		health,
// 		state: {
// 			name: 'aiming',
// 			power: 0,
// 			maxPower: 1,
// 		},
// 	}
