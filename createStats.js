const MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	u = require('./fn/utils'),
	championsTable = require('./static/champions.json'),
	fs = require('fs'),
	_ = require('lodash')

const pipes = {
	champion: id => [{ $match: { championId: id } }],

	countGames: [{ $count: 'counter' }],

	spells: [
		{ $project: { spells: ['$spell1Id', '$spell2Id'], gameId: 1 } },
		{ $unwind: '$spells' },
		{ $sort: { spells: 1 } },
		{ $group: { _id: '$gameId', spells: { $push: '$spells' } } },
		{ $sortByCount: '$spells' },
		{ $limit: 5 },
	],

	wins: [{ $match: { 'stats.win': true } }, { $count: 'counter' }],

	firstBloods: [
		{
			$lookup: {
				from: 'games400',
				let: { idOfMatch: '$gameId', idTeamOfPlayer: '$teamId' },
				pipeline: [
					{ $match: { $expr: { $eq: ['$gameId', '$$idOfMatch'] } } },
					{ $project: { _id: false, teams: true } },
					{ $unwind: '$teams' },
					{ $replaceRoot: { newRoot: '$teams' } },
					{ $match: { $expr: { $eq: ['$$idTeamOfPlayer', '$teamId'] } } },
					{ $project: { _id: false, firstBlood: true } },
				],
				as: 'game',
			},
		},
		{ $match: { 'game.firstBlood': true } },
		{ $count: 'counter' },
	],
}

const spellsPipe = id => [].concat(pipes.champion(id), pipes.spells)
;(async () => {
	const champiDB = (await MongoClient.connect(mongoKey)).db('champiDB')
	const players400 = champiDB.collection('players400')
	const stats400 = champiDB.collection('stats400')

	u.clearCollection('stats400', champiDB)

	for (champion of _.sortBy(championsTable, 'name')) {
		// ;(async champion => {
		const computedStats = {}

		computedStats.name = champion.name
		computedStats._id = champion.id

		computedStats.games = (await players400
			.aggregate([].concat(pipes.champion(champion.id), pipes.countGames))
			.next()).counter

		computedStats.spells = await players400
			.aggregate([].concat(pipes.champion(champion.id), pipes.spells))
			.toArray()

		computedStats.wins = (await players400
			.aggregate([].concat(pipes.champion(champion.id), pipes.wins))
			.toArray())[0].counter

		computedStats.winRate =
			(computedStats.wins / computedStats.games * 100).toFixed(1) + '%'

		computedStats.firstBloods = (await players400
			.aggregate([].concat(pipes.champion(champion.id), pipes.firstBloods))
			.next()).counter
		computedStats.firstBloodRate =
			(computedStats.firstBloods / computedStats.games * 100).toFixed(1) + '%'

		console.log(`\n\n\nSTATS OF ${champion.name.toUpperCase()}`)
		console.log(computedStats)
		stats400.insertOne(computedStats)
		// })(champion)
	}
})()
