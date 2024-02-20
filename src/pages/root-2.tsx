import { GameContextProvider } from '../components/GameProvider'
import { GameWrapper } from '../components/GameWrapper'

export function BackupRoute() {
	return (
		<GameContextProvider backup>
			<GameWrapper />
		</GameContextProvider>
	)
}
