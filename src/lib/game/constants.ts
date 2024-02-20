import { Vec } from '../Vec'

export const ROOM_ID = 'example'
export const ROOM_VERSION = 33

const FPS = 60
export const FRAME_LENGTH = 1000 / FPS

export const TIME_TO_MAX_POWER = 500
export const TIME_TO_RECOVER = 360

export const MOVEMENT_PER_FRAME = 3 // pixels per frame

export const PLAYER_SIZE = 50
export const CLICK_DISTANCE = PLAYER_SIZE * 2

export const BALL_SIZE = 8
export const BASE_BALL_SPEED = 8

export const SERVER_TICK_LENGTH = 50

export const MAX_AI_PLAYERS = 6

export const KILL_DISPLAY_LENGTH = 5000

const _WE_VECTOR = Vec.FromAngle(26 * (Math.PI / 180))
export const WE_VECTOR = _WE_VECTOR.toJson()
export const EW_VECTOR = _WE_VECTOR.clone().neg().toJson()

export const BORDER_VECTOR = Vec.FromAngle(-26 * (Math.PI / 180))
