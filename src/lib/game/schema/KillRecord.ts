import { BaseRecord, RecordId, createRecordType, defineMigrations } from '@tldraw/store'
import { IPlayer } from './PlayerRecord'

export interface IKill extends BaseRecord<'kill', RecordId<IKill>> {
	created_at: number
	from: RecordId<IPlayer>
	to: RecordId<IPlayer>
}

const migrations = defineMigrations({})

export const KillRecord = createRecordType<IKill>('kill', {
	migrations,
	validator: {
		validate: (record) => {
			return record as IKill
		},
	},
	scope: 'document',
}).withDefaultProperties(() => ({
	created_at: Date.now(),
}))
