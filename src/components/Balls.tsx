import { useValue } from '@tldraw/state'
import { memo } from 'react'
import { useGame } from '../hooks/useGame'
import { Ball } from './Ball'

export const Balls = memo(function Balls() {
	const game = useGame()
	const balls = useValue('balls', () => game.balls, [game])

	return (
		<>
			{balls.map((ball) => (
				<Ball key={ball.id} ball={ball} />
			))}
		</>
	)
})
