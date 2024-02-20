import { useValue } from '@tldraw/state'
import { memo, useRef } from 'react'
import { useGame } from '../hooks/useGame'
import { usePosition } from '../hooks/usePosition'

export const ThrowingPower = memo(function ThrowingPower() {
	const rContainer = useRef<HTMLDivElement>(null)

	const game = useGame()
	const player = useValue('player', () => game.player, [game])

	usePosition(rContainer, player?.position.x, player?.position.y, 2000)

	if (!player) return null

	return (
		<div className="player__throwing-power" ref={rContainer} draggable={false}>
			{player.state.name === 'aiming' &&
				Array.from({ length: Math.ceil(player.state.power * 8) }).map((_, i) => (
					<div
						key={i}
						className="player__throwing-power__chunk"
						data-power={i + 1}
						draggable={false}
					/>
				))}
		</div>
	)
})
