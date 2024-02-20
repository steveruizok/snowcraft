import { atom, computed, transact } from '@tldraw/state'
import { Store } from '@tldraw/store'
import { getMovingUserPlayer } from '../../shared/getMovingUserPlayerPosition'
import { getRespawnPosition } from '../../shared/getRespawnPosition'
import { getSnowballHits } from '../../shared/getSnowballHits'
import { spawnBall } from '../../shared/spawnBall'
import { updateBall } from '../../shared/updateBall'
import { updateHitPlayers } from '../../shared/updateHitPlayers'
import { updatePlayer } from '../../shared/updatePlayer'
import { Box } from '../Box'
import { Vec, VecModel } from '../Vec'
import { CLICK_DISTANCE, FRAME_LENGTH } from './constants'
import { GameRecord, gameSchema } from './schema'
import { IBall } from './schema/BallRecord'
import { IKill } from './schema/KillRecord'
import { IPile } from './schema/PileRecord'
import { IPlayer, PlayerRecord } from './schema/PlayerRecord'
import { getLocalPlayer, persistLocalPlayer } from './storage'
import { syncStore } from './sync'
import { GameInputs } from './types'

const localPlayer = getLocalPlayer()

export class Game {
	constructor({ backup, onReady }: { backup: boolean; onReady: () => void }) {
		// Clear any initial data
		this.store.clear()

		// Connect to the server
		const unsubs = syncStore(this.store, localPlayer.id, backup, {
			onPing: (ms) => {
				this.ping.set(ms)
			},
			onReady: () => {
				// When connected and synced, add the player
				this.store.put([
					PlayerRecord.create({
						...localPlayer,
						position: getRespawnPosition(localPlayer, this.screenSize.get()).toJson(),
						state: { name: 'idle' },
						health: 1,
					}),
				])

				setTimeout(() => {
					this.status.set('ready')
					onReady?.()
				}, 500)
			},
		})

		this.disposables.push(...unsubs)
	}

	private disposables: (() => void)[] = []

	public dispose = () => {
		for (const dispose of this.disposables) {
			dispose()
		}
	}

	public status = atom('status', 'loading')

	public ping = atom('ping', 0)

	public store = new Store<GameRecord>({
		schema: gameSchema,
		props: {},
	})

	private _playerId = atom<IPlayer['id']>('player_id', localPlayer.id)
	@computed get playerId() {
		return this._playerId.get()
	}

	private _playersQuery = this.store.query.records('player')
	@computed public get players() {
		return this._playersQuery.get().filter(Boolean) as IPlayer[]
	}

	private _ballsQuery = this.store.query.records('ball')
	@computed public get balls() {
		return this._ballsQuery.get().filter(Boolean) as IBall[]
	}

	private _pilesQuery = this.store.query.records('pile')
	@computed public get piles() {
		return this._pilesQuery.get().filter(Boolean) as IPile[]
	}

	private _killsQuery = this.store.query.records('kill')
	@computed public get kills() {
		return this._killsQuery.get().filter(Boolean) as IKill[]
	}

	@computed public get player() {
		return this.store.get(this.playerId)!
	}

	public screenSize = atom('screen size', new Box(0, 0, window.innerWidth, window.innerHeight))

	public inputs: GameInputs = {
		pointer: { name: 'up', point: new Vec(0, 0) },
	}

	updatePlayer(props: Partial<IPlayer>) {
		this.store.update(this.playerId, (player) => ({
			...player,
			...props,
		}))
	}

	/* ------------------- Coordinates ------------------ */

	public screenToWorld = (screen: Vec) => {
		const { x, y, w, h } = this.screenSize.get()
		return new Vec(screen.x - (x + w / 2), screen.y - (y + h / 2))
	}

	public worldToScreen = (world: Vec) => {
		const { x, y, w, h } = this.screenSize.get()
		return new Vec(world.x + (x + w / 2), world.y + (y + h / 2))
	}

	/* --------------------- Events --------------------- */

	public onPointerMove = (point: Vec) => {
		this.inputs.pointer.point = point
	}

	public onPointerDown = () => {
		const { pointer: currentPointer } = this.inputs

		if (Vec.Dist(this.inputs.pointer.point, this.player.position) < CLICK_DISTANCE) {
			this.inputs.pointer = {
				name: 'dragging',
				point: currentPointer.point.clone(),
				downPoint: currentPointer.point.clone(),
				offset: Vec.Sub(this.inputs.pointer.point, this.player.position),
			}
		} else {
			this.inputs.pointer = {
				name: 'down',
				point: currentPointer.point.clone(),
				downPoint: currentPointer.point.clone(),
			}
		}

		switch (this.player.state.name) {
			case 'idle': {
				if (this.inputs.pointer.name === 'dragging') {
					this.updatePlayer({
						state: {
							name: 'aiming',
							power: 0,
							maxPower: 1,
						},
					})
				}
				break
			}
		}
	}

	public onPointerUp = () => {
		const { pointer: currentPointer } = this.inputs

		this.inputs.pointer = {
			name: 'up',
			point: currentPointer.point.clone(),
		}

		const { state } = this.player
		switch (state.name) {
			case 'aiming': {
				transact(() => {
					const ball = spawnBall(this.player)
					this.store.put([ball])
					this.updatePlayer({ state: { name: 'throwing', recovery: Math.max(0.75, state.power) } })
				})
				break
			}
		}
	}

	public onPointerEnter = () => {
		// noop
	}

	public onPointerLeave = () => {
		const { pointer: currentPointer } = this.inputs

		this.inputs.pointer = {
			name: 'up',
			point: currentPointer.point.clone(),
		}
	}

	/* ---------------------- Tick ---------------------- */

	public persist() {
		persistLocalPlayer(this.player)
	}

	public tick(elapsed: number) {
		const frames = elapsed / FRAME_LENGTH

		if (this.status.get() !== 'ready') return

		const recordsToUpdatePrivately: GameRecord[] = []
		const recordsToUpdatePublicly: GameRecord[] = []

		const { piles, players, playerId } = this

		const balls = new Map<IBall, [VecModel, VecModel]>()

		// Update the balls
		this.balls.forEach((ball) => {
			const nextBall = updateBall(frames, ball as IBall, piles)
			if (ball === nextBall) return
			balls.set(nextBall, [ball.position, nextBall.position])
			recordsToUpdatePrivately.push(nextBall)
		})

		// Show hits optimistically
		getSnowballHits(balls, players).forEach((player, ball) => {
			if (player.isAi) {
				// Show the player that it's been hit, stop the balls
				const nextPlayer = updateHitPlayers(player, ball)
				recordsToUpdatePublicly.push(nextPlayer)
				recordsToUpdatePrivately.push({ ...ball, power: 0 })
			}
		})

		// Update the players
		for (const initialPlayer of players) {
			const { player, balls, notes, isPrivate } = updatePlayer(frames, initialPlayer, players, {
				name: 'client',
				playerId,
				screenSize: this.screenSize.get(),
			})

			let resultPlayer = player
			let resultIsPrivate = isPrivate

			if (notes.length > 0) {
				for (const note of notes) {
					switch (note) {
						case 'PLAYER_MOVED': {
							const { pointer } = this.inputs
							if (pointer.name === 'dragging') {
								resultPlayer = getMovingUserPlayer(frames, player, pointer)
								resultIsPrivate = false
							}
							break
						}
						case 'PLAYER_RECOVERED': {
							const { pointer } = this.inputs
							if (pointer.name === 'dragging') {
								pointer.downPoint = Vec.From(player.position)
								pointer.offset = Vec.Sub(pointer.downPoint, player.position)

								// Set the player state
								resultPlayer = {
									...player,
									state: {
										name: 'aiming',
										power: 0,
										maxPower: 1,
									},
								}

								// Update the player direction / position
								resultPlayer = getMovingUserPlayer(frames, resultPlayer, pointer)
								resultIsPrivate = false
							}
							break
						}
					}
				}
			}

			// Always update any changed balls
			recordsToUpdatePrivately.push(...balls)

			// Update the player if it's changed
			if (initialPlayer !== resultPlayer) {
				if (resultIsPrivate) {
					// ...some player updates are private (i.e. decreasing the recovery of a player)
					recordsToUpdatePrivately.push(resultPlayer)
				} else {
					recordsToUpdatePublicly.push(resultPlayer)
				}
			}
		}

		// Apply the private changes (these will not be sent to the server)
		if (recordsToUpdatePrivately.length > 0) {
			this.store.mergeRemoteChanges(() => {
				this.store.put(recordsToUpdatePrivately)
			})
		}

		// Apply the public changes (these will be sent to the server)
		if (recordsToUpdatePublicly.length > 0) {
			this.store.put(recordsToUpdatePublicly)
		}
	}
}
