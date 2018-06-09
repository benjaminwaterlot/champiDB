const MongoClient = require(`mongodb`).MongoClient
const mongoKey = require(`./mongoDbUrl`)
const u = require('./fn/utils')
const championsTable = require('./static/champions.json')
const itemsTable = require('./static/items.json')
const _ = require('lodash/fp')
_.reduce = require('lodash/fp/reduce').convert({ cap: false })

const positionsTable = championsTable.reduce((table, currentChamp) => {
	const currentChampWithRoles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(
		position => ({ ...currentChamp, position: position }),
	)
	return [...table, ...currentChampWithRoles]
}, [])

const finalItemsIdTable = _.flow(
	_.reduce((result, value, key) => [...result, { ...value, id: key }], []),
	_.filter(
		item => !item.into && (item.gold || {}).total > 1000 && item.depth > 1,
	),
	_.map(item => item.id),
)(itemsTable.data)
console.log(finalItemsIdTable)

const pipes = {
	initialMatch: ({ id, position }) => [
		{ $match: { championId: id, position: position } },
	],

	gamesCount: [{ $count: 'counter' }],

	wins: [{ $match: { 'stats.win': true } }, { $count: 'counter' }],

	spells: [
		{ $project: { spells: ['$spell1Id', '$spell2Id'], gameId: 1 } },
		{ $unwind: '$spells' },
		{ $sort: { spells: 1 } },
		{ $group: { _id: '$gameId', spells: { $push: '$spells' } } },
		{ $sortByCount: '$spells' },
		{ $limit: 5 },
	],

	allItems_startingItems: [
		{
			$project: {
				itemsSet: {
					$reduce: {
						input: '$events.items',
						initialValue: { totalGold: 0, items: [] },
						in: {
							startingItems: {
								$concatArrays: [
									'$$value.items',
									{
										$cond: {
											if: {
												$and: [
													{
														$lte: [
															{ $add: ['$$value.totalGold', '$$this.gold'] },
															500,
														],
													},
													{ $gt: ['$$this.gold', 0] },
												],
											},
											then: ['$$this.itemId'],
											else: [],
										},
									},
								],
							},
							allItems: {
								$concatArrays: [
									'$$value.items',
									{
										$cond: {
											if: {
												$and: [
													{
														$lte: [
															{ $add: ['$$value.totalGold', '$$this.gold'] },
															500,
														],
													},
													{ $gt: ['$$this.gold', 0] },
												],
											},
											then: ['$$this.itemId'],
											else: [],
										},
									},
								],
							},
							totalGold: {
								$add: ['$$value.totalGold', '$$this.gold'],
							},
						},
					},
				},
			},
		},
		{ $sortByCount: '$itemsSet.startingItems' },
	],

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
//
;(async () => {
	const champiDB = (await MongoClient.connect(mongoKey)).db('champiDB')
	const playersDB = champiDB.collection('players000')
	const statsDB = champiDB.collection('stats000')

	u.clearCollection('stats000', champiDB)

	for (champion of _.sortBy('name')(positionsTable)) {
		;(async champion => {
			const computedStats = {}

			computedStats.name = champion.name
			computedStats.id = champion.id
			computedStats.position = champion.position

			computedStats.games = (await playersDB
				.aggregate(pipes.initialMatch(champion))
				.toArray()).length

			if (computedStats.games === 0) return null

			computedStats.spells = await playersDB
				.aggregate([...pipes.initialMatch(champion), ...pipes.spells])
				.toArray()

			computedStats.wins = (
				(await playersDB
					.aggregate([...pipes.initialMatch(champion), ...pipes.wins])
					.next()) || {}
			).counter

			computedStats.startingItems = await playersDB
				.aggregate([...pipes.initialMatch(champion), ...pipes.startingItems])
				.toArray()

			computedStats.winRate =
				((computedStats.wins / computedStats.games) * 100).toFixed(1) + '%'

			computedStats.firstBloods = (
				(await playersDB
					.aggregate([...pipes.initialMatch(champion), ...pipes.firstBloods])
					.next()) || {}
			).counter

			computedStats.firstBloodRate =
				((computedStats.firstBloods / computedStats.games) * 100).toFixed(1) +
				'%'

			console.log(
				`\n\n\nSTATS OF ${champion.name.toUpperCase()} ${champion.position.toUpperCase()}\n`,
				computedStats,
			)

			statsDB.insertOne(computedStats)
		})(champion)
	}
})()
