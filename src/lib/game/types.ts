import { HistoryEntry, SerializedSchema, StoreSnapshot } from '@tldraw/store'
import { Vec, VecModel } from '../Vec'
import { GameRecord } from './schema'
import { IPlayer } from './schema/PlayerRecord'

export type PlayerTeam = 'red' | 'green'
export type PlayerState =
	| { name: 'idle' }
	| { name: 'moving'; to: VecModel; ai: true }
	| { name: 'waiting'; duration: number; ai: true }
	| { name: 'aiming'; power: number; maxPower: number }
	| { name: 'throwing'; recovery: number }
	| { name: 'hit'; recovery: number }
	| { name: 'dead'; recovery: number }

export type GameInputs = {
	pointer: PointerState
}

export type PointerState =
	| {
			name: 'up'
			point: Vec
	  }
	| {
			name: 'down'
			point: Vec
			downPoint: Vec
	  }
	| {
			name: 'dragging'
			point: Vec
			downPoint: Vec
			offset: Vec
	  }

export type ServerToClientMessage =
	| {
			type: 'pong'
			clientId: 'server'
			clock: number
	  }
	| {
			type: 'init'
			clientId: 'server'
			clock: number
			snapshot: {
				store: StoreSnapshot<GameRecord>
				schema: SerializedSchema
			}
	  }
	| {
			type: 'recovery'
			clientId: 'server'
			clock: number
			snapshot: {
				store: StoreSnapshot<GameRecord>
				schema: SerializedSchema
			}
	  }
	| {
			type: 'update'
			clientId: 'server'
			clock: number
			updates: ClientUpdateFromServer[]
	  }

export type ClientUpdateFromServer = {
	clientId: IPlayer['id'] | 'server'
	updates: HistoryEntry<GameRecord>[]
}

export type ClientToServerMessage =
	| {
			type: 'ping'
			clientId: IPlayer['id']
			clock: number
	  }
	| {
			type: 'recovery'
			clientId: IPlayer['id']
			clock: number
	  }
	| {
			type: 'update'
			clientId: IPlayer['id']
			clock: number
			updates: HistoryEntry<GameRecord>[]
	  }

export type ServerRecord<T extends GameRecord = GameRecord> =
	| {
			clock: number
			record: Readonly<T>
	  }
	| {
			clock: number
			record: null
	  }
