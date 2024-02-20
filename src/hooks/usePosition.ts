import { useValue } from '@tldraw/state'
import { RefObject, useLayoutEffect } from 'react'
import { useGame } from './useGame'

export function usePosition(ref: RefObject<HTMLDivElement>, x = 0, y = 0, zOffset = 0) {
	const game = useGame()
	const screenSize = useValue('screen size', () => game.screenSize.get(), [game])

	useLayoutEffect(() => {
		const elm = ref.current
		if (!elm) return
		const cx = screenSize.x + screenSize.w / 2
		const cy = screenSize.y + screenSize.h / 2
		elm.style.setProperty('transform', `translate(${cx + x}px, ${cy + y}px)`)
		elm.style.setProperty('z-index', (zOffset + y).toFixed(0))
	}, [ref, game, screenSize, zOffset, x, y])
}
