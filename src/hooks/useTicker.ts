import { useEffect } from 'react'
import { useGame } from './useGame'

export function useTicker() {
	const game = useGame()

	useEffect(() => {
		let cancelled = false

		let last = performance.now()
		let lastPersist = performance.now()

		function tick() {
			if (cancelled) return

			const now = performance.now()
			const elapsed = now - last
			game.tick(elapsed)

			last = now

			if (now - lastPersist >= 1000 * 5) {
				game.persist()
				lastPersist = now
			}

			requestAnimationFrame(tick)
		}

		const raf = requestAnimationFrame(tick)

		return () => {
			cancelled = true
			cancelAnimationFrame(raf)
		}
	})
}
