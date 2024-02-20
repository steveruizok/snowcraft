import { useCallback } from 'react'
import { Vec } from '../lib/Vec'
import { useGame } from './useGame'

export function useInputEvents() {
	const game = useGame()

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			game.onPointerMove(game.screenToWorld(new Vec(e.clientX, e.clientY)))
		},
		[game]
	)

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.currentTarget.setPointerCapture(e.pointerId)
			game.onPointerMove(game.screenToWorld(new Vec(e.clientX, e.clientY)))
			game.onPointerDown()
		},
		[game]
	)

	const onPointerUp = useCallback(
		(e: React.PointerEvent) => {
			e.currentTarget.releasePointerCapture(e.pointerId)
			game.onPointerMove(game.screenToWorld(new Vec(e.clientX, e.clientY)))
			game.onPointerUp()
		},
		[game]
	)

	const onPointerLeave = useCallback(() => {
		game.onPointerLeave()
	}, [game])

	const onPointerEnter = useCallback(() => {
		game.onPointerEnter()
	}, [game])

	// // Debugging
	// useEffect(() => {
	// 	const interval = setInterval(() => {
	// 		const { player } = game
	// 		if (player.team === 'red') return
	// 		game.onPointerMove(Vec.From(player.position))
	// 		game.onPointerDown()
	// 		setTimeout(() => {
	// 			game.onPointerUp()
	// 		}, 1000)
	// 	}, 2000)

	// 	return () => {
	// 		clearInterval(interval)
	// 	}
	// }, [game])

	return {
		onPointerMove,
		onPointerDown,
		onPointerUp,
		onPointerLeave,
		onPointerEnter,
	}
}
