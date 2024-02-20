import { useValue } from '@tldraw/state'
import { memo } from 'react'
import { useGame } from '../hooks/useGame'
import { IKill } from '../lib/game/schema/KillRecord'

export const Kill = memo(function Kill({ kill }: { kill: IKill }) {
	const game = useGame()
	const from = useValue('from', () => game.store.get(kill.from)?.name ?? 'Someone', [game])
	const to = useValue('from', () => game.store.get(kill.to)?.name ?? 'Someone', [game])

	if (!(from && to)) return null
	return (
		<div className="kill_container">
			{from} ❄️ {to}
		</div>
	)
})
