import { BaseRecord, RecordId, createRecordType, defineMigrations } from '@tldraw/store'
import { VecModel } from '../../Vec'
import { PlayerTeam } from '../types'
import { IPlayer } from './PlayerRecord'

export interface IBall extends BaseRecord<'ball', RecordId<IBall>> {
	created_at: number
	created_by: IPlayer['id']
	team: PlayerTeam
	position: VecModel
	velocity: VecModel
	power: number
	fullPower: boolean
}

const migrations = defineMigrations({})

export const BallRecord = createRecordType<IBall>('ball', {
	migrations,
	validator: {
		validate: (record) => {
			return record as IBall
		},
	},
	scope: 'document',
}).withDefaultProperties(() => ({
	created_at: Date.now(),
}))
