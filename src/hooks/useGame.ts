import { createContext, useContext } from 'react'
import { Game } from '../lib/game/Game'

export const gameContext = createContext({} as Game)

export function useGame() {
	return useContext(gameContext)
}
