import { useEffect, useState } from 'react'
import { gameContext } from '../hooks/useGame'
import { Game } from '../lib/game/Game'

export function GameContextProvider({ children, backup }: { children: any; backup: boolean }) {
	const [ready, setIsReady] = useState(false)
	const [game, setGame] = useState(() => ({}) as Game)

	useEffect(() => {
		setIsReady(false)
		const game = new Game({ backup, onReady: () => setIsReady(true) })
		setGame(game)

		return () => {
			game.dispose()
		}
	}, [backup])

	if (!ready) return <div className="loading">Connecting...</div>

	return <gameContext.Provider value={game}>{children}</gameContext.Provider>
}
