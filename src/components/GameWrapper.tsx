import { useValue } from '@tldraw/state'
import { useGame } from '../hooks/useGame'
import { useInputEvents } from '../hooks/useInputEvents'
import { useScreenSize } from '../hooks/useScreenSize'
import { useTicker } from '../hooks/useTicker'
import { Attribution } from './Attribution'
import { Balls } from './Balls'
import { Kills } from './Kills'
import { NameInput } from './NameInput'
import { Piles } from './Piles'
import { Ping } from './Ping'
import { Players } from './Players'
import { ThrowingPower } from './ThrowingPower'

export function GameWrapper() {
	useTicker()
	useScreenSize()
	const events = useInputEvents()

	const game = useGame()
	const status = useValue('status', () => game.status.get(), [game])

	if (status !== 'ready') return null

	return (
		<div className="game-container" draggable={false}>
			<div className="game-events" draggable={false} {...events} />
			<Players />
			<Balls />
			<Piles />
			<ThrowingPower />
			<NameInput />
			<Attribution />
			<Ping />
			<Kills />
		</div>
	)
}
