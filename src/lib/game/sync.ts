import { Store, StoreListener } from '@tldraw/store'
import PartySocket from 'partysocket'
import { ROOM_ID, ROOM_VERSION } from './constants'
import { GameRecord } from './schema'
import { IPlayer } from './schema/PlayerRecord'
import { ServerToClientMessage } from './types'

const HOST_URL = import.meta.env.DEV
	? 'localhost:1999'
	: import.meta.env.VITE_PRODUCTION_URL.replace('https://', 'ws://') // remove protocol just in case

const BACKUP_HOST_URL = import.meta.env.DEV
	? '10.50.102.30:1999'
	: import.meta.env.VITE_PRODUCTION_URL.replace('https://', 'ws://') // remove protocol just in case

export function syncStore(
	store: Store<GameRecord>,
	clientId: IPlayer['id'],
	backup: boolean,
	events = {} as {
		onReady?: () => void
		onPing?: (ms: number) => void
	}
) {
	const socket = new PartySocket({
		host: backup ? BACKUP_HOST_URL : HOST_URL,
		room: `${ROOM_ID}_${ROOM_VERSION}`,
		// meta: { playerId: clientId }
	})

	// const clientClocks = new Map<string, number>()

	let lastPing = { timestamp: Date.now() }
	let lastClock = -1

	const unsubs: (() => void)[] = []

	const handleOpen = () => {
		socket.removeEventListener('open', handleOpen)
		socket.addEventListener('message', handleMessage)

		const interval = setInterval(() => {
			lastPing = { timestamp: Date.now() }
			socket.send(JSON.stringify({ clientId: clientId, type: 'ping', data: lastPing }))
		}, 1000)

		unsubs.push(() => clearInterval(interval))
	}

	const handleClose = () => {
		socket.removeEventListener('message', handleMessage)
		socket.addEventListener('open', handleOpen)
	}

	const handleMessage = (message: MessageEvent<any>) => {
		try {
			const data = JSON.parse(message.data) as ServerToClientMessage

			lastClock = data.clock // update the most recent server clock seen by this clock

			switch (data.type) {
				case 'init': {
					store.loadSnapshot(data.snapshot)
					events.onReady?.()
					break
				}
				case 'recovery': {
					console.error('received recovery')
					store.loadSnapshot(data.snapshot)
					break
				}
				case 'pong': {
					const now = Date.now()
					const ms = now - lastPing.timestamp
					events.onPing?.(ms)
					break
				}
				case 'update': {
					try {
						store.mergeRemoteChanges(() => {
							for (const item of data.updates) {
								if (!item) continue

								// If we sent it, skip it
								if (item.clientId === clientId) continue

								for (const update of item.updates) {
									const {
										changes: { added, updated, removed },
									} = update

									const allAdded = Object.values(added)
									const allUpdated = Object.values(updated).map((u) => u[1])
									const allRemoved = Object.values(removed).map((r) => r.id)

									if (allAdded.length) {
										store.put(allAdded)
									}

									if (allUpdated.length) {
										store.put(allUpdated)
									}

									if (allRemoved.length) {
										store.remove(allRemoved)
									}
								}
							}
						})
					} catch (e) {
						console.error(e)
						console.error('requested recovery')
						socket.send(JSON.stringify({ clientId: clientId, type: 'recovery' }))
					}
					break
				}
			}
		} catch (e) {
			console.error(e)
		}
	}

	const handleChange: StoreListener<GameRecord> = (event) => {
		if (event.source !== 'user') return

		socket.send(
			JSON.stringify({
				clientId: clientId,
				type: 'update',
				clock: lastClock, // send back the most recent server clock seen by this client
				updates: [event],
			})
		)
	}

	socket.addEventListener('open', handleOpen)
	socket.addEventListener('close', handleClose)

	unsubs.push(
		store.listen(handleChange, {
			source: 'user',
			scope: 'document',
		})
	)

	// unsubs.push(
	// 	store.listen(handleChange, {
	// 		source: 'user',
	// 		scope: 'presence',
	// 	})
	// )

	unsubs.push(() => socket.removeEventListener('open', handleOpen))
	unsubs.push(() => socket.removeEventListener('close', handleClose))
	unsubs.push(() => socket.close())

	return unsubs
}
