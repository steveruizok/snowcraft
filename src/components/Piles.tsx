import { useValue } from '@tldraw/state'
import { useGame } from '../hooks/useGame'
import { Pile } from './Pile'

export function Piles() {
	const game = useGame()
	const piles = useValue('piles', () => game.piles, [game])

	return (
		<>
			{piles.map((pile) => (
				<Pile key={pile.id} pile={pile} />
			))}
		</>
	)
}
