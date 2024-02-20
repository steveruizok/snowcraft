import { Vec } from '../lib/Vec'
import { EASINGS } from '../lib/easings'
import { BASE_BALL_SPEED, PLAYER_SIZE } from '../lib/game/constants'
import { IBall } from '../lib/game/schema/BallRecord'
import { IPile } from '../lib/game/schema/PileRecord'

/** @public */
export type EasingType = keyof typeof EASINGS

export function updateBall(frames: number, ball: IBall, piles: IPile[]) {
	const movementThisFrame = BASE_BALL_SPEED * frames
	if (ball.power <= 0) return ball

	// decellerate the ball
	let power = ball.power
	power -= 0.005 * frames

	// the power's effect on velocity is eased
	const t = ball.fullPower ? 1 : EASINGS.easeOutCubic(power)
	const velocity = Vec.Mul(ball.velocity, t)
	const position = Vec.Add(ball.position, Vec.Mul(velocity, movementThisFrame))

	// eased velocity too low? stop the ball
	if (t < 0.05) power = 0

	// stop the ball if it hits any piles
	for (const pile of piles) {
		// Hit a pile
		const dist = Vec.DistanceToLineSegment(ball.position, position, pile.position, true)
		if (dist < PLAYER_SIZE / 4) {
			power = 0
		}
	}

	return {
		...ball,
		velocity: velocity.toJson(),
		position: position.toJson(),
		power,
	}
}
