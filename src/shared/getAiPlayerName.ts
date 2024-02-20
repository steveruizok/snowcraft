const AI_PLAYER_NAMES = [
	'Dan',
	'Mike',
	'Dave',
	'Sean',
	'Tom',
	'Sandy',
	'Lu',
	'David',
	'Alex',
	'Mitja',
	'Mime',
	'Siob',
]

let i = 0

export function getAiPlayerName() {
	i = (i + 1) % AI_PLAYER_NAMES.length
	return AI_PLAYER_NAMES[i] + ' (Bot)'
}
