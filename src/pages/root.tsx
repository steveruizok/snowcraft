import { GameContextProvider } from '../components/GameProvider'
import { GameWrapper } from '../components/GameWrapper'

export function Component() {
	return (
		<GameContextProvider backup={false}>
			<GameWrapper />
		</GameContextProvider>
	)
}
