const
	MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	u = require('./utils'),
	championsTable = require('./champions.json')

;(async () => {

	const client = await MongoClient.connect(mongoKey)

	const
		champiDB = client.db('champiDB'),
		games28 = champiDB.collection('games28'),
		players28 = champiDB.collection('players28'),
		stats28 = champiDB.collection('stats28')



	const championsView = (async () => {

		const pipeGroupByChamp = [
			{$limit: 500},
			{$unwind: "$participants"},
			{$group: {
				_id: "$participants.championId",
				count: {$sum: 1},
				game: {$push: "$participants"},
				summs: {$push: {summ: ["$participants.spell1Id", "$participants.spell2Id"]}}}
			}
		]

		await u.clearCollection('champions30', champiDB)
		await champiDB.command( { create: 'champions30', viewOn: 'games28', pipeline: pipeGroupByChamp } )

	})()

	const statsView = (async () => {

		const pipeStatsByChamp = [
			{
				$project: {
					"wins": {
						$reduce: {
							input: "$game.stats.win",
							initialValue: 0,
							in: {$add: [
								"$$value",
								{$cond: {if: {$eq: ["$$this", true]}, then: 1, else: 0}}
								]
							}
						}
					},
					"spells": {
						$reduce: {
							input: "$game",
							initialValue: [],
							in: {$concatArrays: ["$$value", [["$$this.spell1Id", "$$this.spell2Id"]]]}
						}
					},
					"items": {
						$reduce: {
							input: "$game",
							initialValue: [],
							in: {
								$concatArrays: ["$$value", [
									[
										"$$this.stats.item1",
										"$$this.stats.item2",
										"$$this.stats.item3",
										"$$this.stats.item4",
										"$$this.stats.item5",
										"$$this.stats.item6",
									]
								]]
							}
						}
					},
				}
			}
		]

		const stats = await champiDB.collection('champions30').aggregate(pipeStatsByChamp, {allowDiskUse: true}).toArray()
		console.log(stats)
		await u.clearCollection('stats30', champiDB)
		await champiDB.command( { create: 'stats30', viewOn: 'champions30', pipeline: pipeStatsByChamp } )

	})()
})()
