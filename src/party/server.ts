import { HistoryEntry, RecordId, SerializedSchema, StoreSnapshot } from '@tldraw/store'
import type * as Party from 'partykit/server'
import { Vec, VecModel } from '../lib/Vec'
import {
	FRAME_LENGTH,
	KILL_DISPLAY_LENGTH,
	MAX_AI_PLAYERS,
	SERVER_TICK_LENGTH,
} from '../lib/game/constants'
import { GameRecord, gameSchema } from '../lib/game/schema'
import { IBall } from '../lib/game/schema/BallRecord'
import { IKill, KillRecord } from '../lib/game/schema/KillRecord'
import { IPile, PileRecord } from '../lib/game/schema/PileRecord'
import { IPlayer, PlayerRecord } from '../lib/game/schema/PlayerRecord'
import {
	ClientToServerMessage,
	ClientUpdateFromServer,
	ServerRecord,
	ServerToClientMessage,
} from '../lib/game/types'
import { getAiPlayerName } from '../shared/getAiPlayerName'
import { getRespawnPosition } from '../shared/getRespawnPosition'
import { getSnowballHits } from '../shared/getSnowballHits'
import { updateBall } from '../shared/updateBall'
import { updateHitPlayers } from '../shared/updateHitPlayers'
import { updatePlayer } from '../shared/updatePlayer'

const schema = gameSchema.serialize()

export default class SyncParty implements Party.Server {
	records: Record<RecordId<GameRecord>, ServerRecord<GameRecord>> = {}
	clients = new Map<Party.Connection<unknown>, IPlayer['id']>()
	aiPlayerIds: IPlayer['id'][] = []

	getSnapshot = (): { store: StoreSnapshot<GameRecord>; schema: SerializedSchema } => {
		return {
			store: Object.fromEntries(
				Object.entries(this.records)
					.filter(([_, { record }]) => !!record)
					.map(([id, { record }]) => [id, record!])
			) as unknown as StoreSnapshot<GameRecord>,
			schema,
		}
	}

	updateRecord = (record: GameRecord) => {
		const previous = this.records[record.id]
		if (previous) {
			this.records[record.id] = { clock: previous.clock + 1, record }
		} else {
			this.records[record.id] = { clock: this.clock, record }
		}
	}

	getRecordById = <T extends GameRecord>(id: RecordId<T>) => {
		return this.records[id] as ServerRecord<T>
	}

	constructor(public party: Party.Party) {
		let lastTime = 0
		this.tick = setInterval(() => {
			const now = Date.now()
			const elapsed = now - lastTime
			lastTime = now
			this.onTick(elapsed)
		}, SERVER_TICK_LENGTH)

		for (let i = 0; i < 10; i++) {
			const t = i / 10
			const cos = Math.cos(t * Math.PI * 2) / 2
			const sin = Math.sin(t * Math.PI * 2)
			const x = cos * 320 + Math.random() * 50
			const y = sin * 320 + Math.random() * 50

			const pile = PileRecord.create({
				position: new Vec(x, y).rot(Math.PI / 2.9).toJson(),
			})
			this.updateRecord(pile)
		}

		for (let i = 0; i < MAX_AI_PLAYERS; i++) {
			const team = i % 2 === 0 ? 'green' : 'red'
			const player = PlayerRecord.create({
				name: getAiPlayerName(),
				team,
				isAi: true,
				speed: 0.4 + Math.random() * 0.2,
				position: getRespawnPosition({ team } as IPlayer).toJson(),
				state: { name: 'waiting', duration: 1000 * Math.random(), ai: true },
			})

			this.aiPlayerIds.push(player.id)
			this.updateRecord(player)
		}
	}

	tick: any
	clock = 0
	hasAlarm = false

	async onConnect(connection: Party.Connection<unknown>) {
		connection.send(
			JSON.stringify({
				type: 'init',
				clock: this.clock,
				snapshot: this.getSnapshot(),
			})
		)
	}

	onClose(connection: Party.Connection<unknown>): void | Promise<void> {
		const clientId = this.clients.get(connection)
		if (clientId) {
			this.removePlayer(clientId)
		}
		this.clients.delete(connection)
	}

	private removePlayer(clientId: IPlayer['id']) {
		const clientPlayerRecord = this.getRecordById(clientId)

		if (clientPlayerRecord) {
			const { record } = clientPlayerRecord
			if (record) {
				this.deleteRecord(record)
				const update: HistoryEntry<GameRecord> = {
					changes: {
						added: {},
						updated: {},
						removed: {
							[record.id]: record,
						},
					},
					source: 'remote',
				}

				this.pendingUpdates.push({ clientId: 'server', updates: [update] })
			}
		}
	}

	private applyUpdate(
		clock: number,
		updates: HistoryEntry<GameRecord>[]
	): HistoryEntry<GameRecord> {
		const ourUpdate: HistoryEntry<GameRecord> = {
			changes: {
				added: {},
				updated: {},
				removed: {},
			},
			source: 'remote',
		}

		for (const update of updates) {
			const {
				changes: { added, updated, removed },
			} = update as HistoryEntry<GameRecord>
			// Try to merge the update into our local store
			for (const record of Object.values(added)) {
				if (this.records[record.id]?.clock > clock) {
					// noop, our copy is newer
					console.log('throwing out add record, ours is newer')
				} else {
					this.records[record.id] = { clock, record }
					ourUpdate.changes.added[record.id] = record
				}
			}
			for (const fromTo of Object.values(updated)) {
				if (this.records[fromTo[1].id]?.clock > clock) {
					console.log('throwing out update record, ours is newer')
					// noop, our copy is newer
				} else {
					this.records[fromTo[1].id] = { clock: this.clock, record: fromTo[1] }
					ourUpdate.changes.updated[fromTo[1].id] = fromTo
				}
			}
			for (const record of Object.values(removed)) {
				if (this.records[record.id]?.clock > clock) {
					console.log('throwing out removed record, ours is newer')
					// noop, our copy is newer
				} else {
					this.records[record.id] = { clock, record: null }
					ourUpdate.changes.removed[record.id] = record
				}
			}
		}

		return ourUpdate
	}

	pendingUpdates: ClientUpdateFromServer[] = []

	onMessage(message: string, sender: Party.Connection<unknown>): void | Promise<void> {
		const msg = JSON.parse(message as string) as ClientToServerMessage

		if (!this.clients.has(sender)) {
			const { clientId } = msg
			this.clients.set(sender, clientId as IPlayer['id'])
		}

		switch (msg.type) {
			case 'ping': {
				sender.send(JSON.stringify({ clientId: 'server', type: 'pong', clock: this.clock }))
				break
			}
			case 'update': {
				try {
					if (!msg) throw Error('No message')
					const modifiedUpdates = this.applyUpdate(this.clock, msg.updates)
					// If it works, broadcast the update to all other clients
					this.pendingUpdates.push({ clientId: msg.clientId, updates: [modifiedUpdates] })
				} catch (err: any) {
					// If we have a problem merging the update, we need to send a snapshot
					// of the current state to the client so they can get back in sync.
					sender.send(
						JSON.stringify({
							type: 'recovery',
							clientId: 'server',
							clock: this.clock,
							snapshot: this.getSnapshot(),
						} satisfies ServerToClientMessage)
					)
				}
				break
			}
			case 'recovery': {
				// If the client asks for a recovery, send them a snapshot of the current state
				sender.send(
					JSON.stringify({
						type: 'recovery',
						clientId: 'server',
						clock: this.clock,
						snapshot: this.getSnapshot(),
					} satisfies ServerToClientMessage)
				)
				break
			}
		}
	}

	onAlarm = (): void | Promise<void> => {}

	private getRecordsOfType = <T extends GameRecord>(type: T['typeName']) => {
		return Object.values(this.records)
			.filter(({ record }) => record && record.typeName === type)
			.map(({ record }) => record) as T[]
	}

	private putRecord = <T extends GameRecord>(record: T) => {
		this.records[record.id] = { clock: this.clock++, record: Object.freeze(record) }
	}

	private deleteRecord = <T extends GameRecord>(record: T) => {
		this.records[record.id] = { clock: this.clock++, record: null }
	}

	onTick = (elapsed: number) => {
		const frames = elapsed / FRAME_LENGTH

		const update: HistoryEntry<GameRecord> = {
			changes: {
				added: {},
				updated: {},
				removed: {},
			},
			source: 'remote',
		}

		const players = this.getRecordsOfType<IPlayer>('player')
		players.forEach((player) => {
			const {
				player: nextPlayer,
				balls,
				isPrivate,
			} = updatePlayer(frames, player as IPlayer, players, {
				name: 'server',
			})

			if (nextPlayer !== player) {
				this.putRecord(nextPlayer)

				if (!isPrivate) {
					update.changes.updated[nextPlayer.id] = [player, nextPlayer]
				}
			}

			// Create any new balls
			for (const ball of balls) {
				this.putRecord(ball)
				update.changes.added[ball.id] = ball // new balls get shared
			}
		})

		const piles = this.getRecordsOfType<IPile>('pile')
		const movingBallSegments = new Map<IBall, [VecModel, VecModel]>()

		// Update ball positions and delete any stopped balls
		this.getRecordsOfType<IBall>('ball').forEach((ball) => {
			const nextBall = updateBall(frames, ball as IBall, piles)
			if (ball === nextBall) {
				return
			}

			if (nextBall.power === 0) {
				// delete the ball and send to clients
				this.deleteRecord(ball)
				// maybe leave a tombstone?
				update.changes.removed[nextBall.id] = nextBall
				return
			} else {
				movingBallSegments.set(nextBall, [(ball as IBall).position, nextBall.position])
				this.putRecord(nextBall)
			}
		})
		// Get the hits after updating the players?

		getSnowballHits(movingBallSegments, this.getRecordsOfType<IPlayer>('player')).forEach(
			(player, ball) => {
				// Show the player that it's been hit
				const nextPlayer = updateHitPlayers(player, ball)
				this.putRecord(nextPlayer)
				update.changes.updated[player.id] = [player, nextPlayer]

				if (nextPlayer.state.name === 'dead') {
					// Create the kill record
					const kill = KillRecord.create({
						from: ball.created_by,
						to: player.id,
					})
					this.putRecord(kill)
					update.changes.added[kill.id] = kill
				}

				// Delete the ball
				this.deleteRecord(ball)
				// todo: Maybe leave a tombstone?

				update.changes.removed[ball.id] = ball
			}
		)

		// Delete any old kills
		const now = Date.now()
		this.getRecordsOfType<IKill>('kill').forEach((kill) => {
			if (now - kill.created_at > KILL_DISPLAY_LENGTH) {
				this.deleteRecord(kill)
				// todo: Maybe leave a tombstone?
				update.changes.removed[kill.id] = kill
			}
		})

		this.clients.forEach((clientId, connection) => {
			if (connection.readyState === WebSocket.CLOSED) {
				this.clients.delete(connection)
				this.removePlayer(clientId)
			}
		})

		// Broadcast our updates
		this.party.broadcast(
			JSON.stringify({
				type: 'update',
				clientId: 'server',
				clock: this.clock,
				updates: [...this.pendingUpdates, { clientId: 'server', updates: [update] }],
			})
		)

		this.pendingUpdates.length = 0
	}
}
