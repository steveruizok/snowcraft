import { StoreSchema } from '@tldraw/store'
import { BallRecord, IBall } from './BallRecord'
import { IKill, KillRecord } from './KillRecord'
import { IPile, PileRecord } from './PileRecord'
import { IPlayer, PlayerRecord } from './PlayerRecord'

export type GameRecord = IPlayer | IBall | IPile | IKill

export const gameSchema = StoreSchema.create<GameRecord>({
	player: PlayerRecord,
	ball: BallRecord,
	pile: PileRecord,
	kill: KillRecord,
})
