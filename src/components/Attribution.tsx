export function Attribution() {
	return (
		<div className="attribution" onPointerDown={(e) => e.stopPropagation()}>
			<p>
				SnowCraft (brood war) by{' '}
				<a href="https://twitter.com/steveruizok" target="_blank">
					Steve Ruiz
				</a>
			</p>
			<p>
				Inspired by{' '}
				<a href="https://www.albinoblacksheep.com/games/snowcraft" target="_blank">
					Snowcraft (1998)
				</a>
			</p>
		</div>
	)
}
