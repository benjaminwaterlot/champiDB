const MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	u = require('./fn/utils'),
	championsTable = require('./static/champions.json'),
	pipe = require('./statPipe'),
	fs = require('fs'),
	_ = require('lodash')
//

const pipes = {
	spreadPlayers: [
		{
			$unwind: '$participants',
		},
		{
			$addFields: { 'participants.gameId': '$gameId' },
		},
		{
			$replaceRoot: { newRoot: '$participants' },
		},
		{
			$out: 'players400',
		},
	],
	spreadGames: [
		{
			$project: { participants: false },
		},
		{
			$out: 'games400',
		},
	],
}
//
;(async () => {
	const client = await MongoClient.connect(mongoKey)
	const champiDB = client.db('champiDB')
	const games = champiDB.collection('games29')

	// CLEAR COLLECTIONS
	await u.clearCollection('players400', champiDB)
	await u.clearCollection('games400', champiDB)

	const spreadGames = await games.aggregate(pipes.spreadGames).toArray()
	const spreadPlayers = await games.aggregate(pipes.spreadPlayers).toArray()

	console.log('DONE\nEXITING...')

	process.exit()
})()
