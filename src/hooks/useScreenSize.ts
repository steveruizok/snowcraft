import { useLayoutEffect } from 'react'
import { Box } from '../lib/Box'
import { useGame } from './useGame'

export function useScreenSize() {
	const game = useGame()

	useLayoutEffect(() => {
		let cancelled = false

		function resize() {
			if (cancelled) return
			const { innerWidth, innerHeight } = window
			game.screenSize.set(new Box(0, 0, innerWidth, innerHeight))
		}

		resize()
		const interval = setInterval(resize, 1000)

		return () => {
			cancelled = true
			clearInterval(interval)
		}
	}, [game])
}
