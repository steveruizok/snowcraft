import { useRef } from 'react'
import { usePosition } from '../hooks/usePosition'
import { PLAYER_SIZE } from '../lib/game/constants'
import { IPile } from '../lib/game/schema/PileRecord'

export function Pile({ pile }: { pile: IPile }) {
	const rContainer = useRef<HTMLDivElement>(null)

	usePosition(rContainer, pile.position.x - PLAYER_SIZE / 2, pile.position.y - PLAYER_SIZE / 2)

	return (
		<>
			<div ref={rContainer} className="pile__container" draggable={false} />
		</>
	)
}
