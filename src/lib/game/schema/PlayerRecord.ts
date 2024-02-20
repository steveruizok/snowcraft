import { BaseRecord, RecordId, createRecordType, defineMigrations } from '@tldraw/store'
import { VecModel } from '../../Vec'
import { PlayerState, PlayerTeam } from '../types'

export interface IPlayer extends BaseRecord<'player', RecordId<IPlayer>> {
	name: string
	created_at: number
	team: PlayerTeam
	health: number
	isAi: boolean
	state: PlayerState
	position: VecModel
	speed: number
}

const migrations = defineMigrations({})

export const PlayerRecord = createRecordType<IPlayer>('player', {
	migrations,
	validator: {
		validate: (record) => {
			return record as IPlayer
		},
	},
	scope: 'document',
}).withDefaultProperties(() => ({
	created_at: Date.now(),
	state: { name: 'idle' },
	health: 1,
	speed: 1,
}))
