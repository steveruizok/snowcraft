import { useValue } from '@tldraw/state'
import { memo } from 'react'
import { useGame } from '../hooks/useGame'

export const Ping = memo(function Ping() {
	const game = useGame()
	const ping = useValue('ping', () => game.ping.get(), [game])

	return <div className="ping">{ping} ms</div>
})
