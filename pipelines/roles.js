const championMatch = require('./championMatch')
const _ = require('lodash')
const PIPE_roles = [
	{
		$sortByCount: {
			$mergeObjects: [{ role: '$timeline.role' }, { lane: '$timeline.lane' }],
		},
	},
]

module.exports = async ({ collection, championId }) => {
	let originalRoles = await collection
		.aggregate([].concat(championMatch(championId), PIPE_roles))
		.toArray()

	let relevantOriginalRoles = originalRoles.filter(role => role.count > 5)

	let newRoles = relevantOriginalRoles.map(guess => {
		let newGuess = {}
		newGuess.count = guess.count
		newGuess.position =
			guess._id.role === 'NONE' && guess._id.lane === 'JUNGLE'
				? 'JUNGLE'
				: guess._id.role === 'SOLO' && guess._id.lane === 'MIDDLE'
					? 'MID'
					: guess._id.role === 'SOLO' && guess._id.lane === 'TOP'
						? 'TOP'
						: guess._id.role === 'DUO_CARRY' && guess._id.lane === 'BOTTOM'
							? 'ADC'
							: guess._id.role === 'DUO_SUPPORT' && guess._id.lane === 'BOTTOM'
								? 'SUPPORT'
								: false

		return newGuess.position ? newGuess : false
	})
	return newRoles.filter(role => role)
}
