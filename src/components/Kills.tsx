import { useValue } from '@tldraw/state'
import { memo } from 'react'
import { useGame } from '../hooks/useGame'
import { Kill } from './Kill'

export const Kills = memo(function Kills() {
	const game = useGame()
	const kills = useValue('kills', () => game.kills, [game])

	return (
		<div className="kills__container">
			{kills.map((kill) => (
				<Kill key={kill.id} kill={kill} />
			))}
		</div>
	)
})
