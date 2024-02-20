import { ROOM_VERSION } from './constants'
import { IPlayer, PlayerRecord } from './schema/PlayerRecord'

export function getLocalPlayer() {
	// Get the user from local storage
	let player: IPlayer
	let userName: string
	try {
		const userNameStr = localStorage.getItem('snowcraft_username')
		if (!userNameStr) throw new Error('No user found')
		userName = userNameStr
	} catch (e) {
		userName = ''
	}

	try {
		const userStr = localStorage.getItem(`snowcraft_user_${ROOM_VERSION}`)!
		if (!userStr) throw new Error('No user found')
		player = JSON.parse(userStr)
	} catch (e) {
		const userId = PlayerRecord.createId()
		const team = Math.random() > 0.5 ? 'red' : 'green'
		player = PlayerRecord.create({
			id: userId,
			name: userName,
			isAi: false,
			team,
			position: { x: 0, y: 0 }, // created automatically in game
		})

		localStorage.setItem(`snowcraft_user_${ROOM_VERSION}`, JSON.stringify(player))
	}

	return player
}

export function persistLocalPlayer(player: IPlayer) {
	localStorage.setItem(`snowcraft_username`, JSON.stringify(player.name))
	localStorage.setItem(`snowcraft_user_${ROOM_VERSION}`, JSON.stringify(player))
}
