import { BaseRecord, RecordId, createRecordType, defineMigrations } from '@tldraw/store'
import { VecModel } from '../../Vec'

export interface IPile extends BaseRecord<'pile', RecordId<IPile>> {
	created_at: number
	position: VecModel
}

const migrations = defineMigrations({})

export const PileRecord = createRecordType<IPile>('pile', {
	migrations,
	validator: {
		validate: (record) => {
			return record as IPile
		},
	},
	scope: 'document',
}).withDefaultProperties(() => ({
	created_at: Date.now(),
}))
