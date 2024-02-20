import cx from 'classnames'
import { memo, useRef } from 'react'
import { usePosition } from '../hooks/usePosition'
import { IPlayer } from '../lib/game/schema/PlayerRecord'

const step = 1 / 8

export const Player = memo(function Player({
	player,
	isPlayer,
	isOverlay,
}: {
	player: IPlayer
	isOverlay: boolean
	isPlayer: boolean
}) {
	const rContainer = useRef<HTMLDivElement>(null)

	usePosition(rContainer, player?.position.x, player?.position.y, isOverlay ? 1000 : 0)

	if (!player) return null

	const { health } = player

	return (
		<>
			<div
				ref={rContainer}
				className={cx('player__container')}
				data-team={player.team}
				data-state={player.state.name}
				data-isplayer={isPlayer}
				data-isoverlay={isOverlay}
				draggable={false}
			>
				{player.name ? (
					<div className="player__name">
						{player.name.length > 32 ? player.name.slice(0, 32) + '..' : player.name}
					</div>
				) : null}
				{player.state.name !== 'dead' && (
					<div
						className="player__health"
						data-state={health > 0.8 ? 'high' : health > 0.6 ? 'med' : 'low'}
					>
						<div
							className="player__health__chunk"
							data-opacity={health < step * 1 ? 'low' : health < step * 2 ? 'med' : 'high'}
						/>
						<div
							className="player__health__chunk"
							data-opacity={health < step * 3 ? 'low' : health < step * 4 ? 'med' : 'high'}
						/>
						<div
							className="player__health__chunk"
							data-opacity={health < step * 5 ? 'low' : health < step * 6 ? 'med' : 'high'}
						/>
						<div
							className="player__health__chunk"
							data-opacity={health < step * 7 ? 'low' : health < step * 8 ? 'med' : 'high'}
						/>
					</div>
				)}
			</div>
		</>
	)
})
