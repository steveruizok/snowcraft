import { useValue } from '@tldraw/state'
import { memo, useCallback } from 'react'
import { useGame } from '../hooks/useGame'

export const NameInput = memo(function NameInput() {
	const game = useGame()
	const name = useValue('name', () => game.player?.name || '', [game])

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value ?? ''
			game.updatePlayer({ name: value })
		},
		[game]
	)

	return (
		<div className="name_input__container">
			<input
				className="name_input__input"
				type="text"
				placeholder="Enter your name"
				defaultValue={name}
				onChange={handleInputChange}
			/>
		</div>
	)
})
