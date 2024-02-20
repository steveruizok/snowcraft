import { memo, useRef } from 'react'
import { usePosition } from '../hooks/usePosition'
import { Vec } from '../lib/Vec'
import { BALL_SIZE } from '../lib/game/constants'
import { IBall } from '../lib/game/schema/BallRecord'

export const Ball = memo(function ({ ball }: { ball: IBall }) {
	const rContainer = useRef<HTMLDivElement>(null)
	const rShadow = useRef<HTMLDivElement>(null)

	usePosition(
		rContainer,
		ball.position.x - BALL_SIZE / 2,
		ball.position.y - BALL_SIZE / 2 + (15 - 15 * Vec.Len(ball.velocity))
	)
	usePosition(rShadow, ball.position.x - BALL_SIZE / 2, ball.position.y - BALL_SIZE / 2 + 15, -1000)

	if (ball.power === 0) return null

	return (
		<>
			<div ref={rShadow} className="ball__shadow" draggable={false} />
			<div ref={rContainer} className="ball__container" draggable={false} />
		</>
	)
})
