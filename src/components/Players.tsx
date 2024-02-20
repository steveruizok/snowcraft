import { useValue } from '@tldraw/state'
import { memo } from 'react'
import { useGame } from '../hooks/useGame'
import { Player } from './Player'

export const Players = memo(function Players() {
	const game = useGame()
	const players = useValue('players', () => game.players, [game])
	const userPlayer = useValue('player', () => game.player, [game])

	if (!userPlayer) return null

	return (
		<>
			{players.map((player) => (
				<Player
					key={player.id}
					player={player}
					isPlayer={userPlayer.id === player.id}
					isOverlay={false}
				/>
			))}

			{players.map((player) => (
				<Player
					key={player.id}
					player={player}
					isPlayer={userPlayer.id === player.id}
					isOverlay={true}
				/>
			))}
		</>
	)
})
