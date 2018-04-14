const
	MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	u = require('./utils'),
	championsTable = require('./static/champions.json'),
	pipe = require('./statPipe')

;(async () => {

	const client = await MongoClient.connect(mongoKey)

	const
		champiDB = client.db('champiDB'),
		games28 = champiDB.collection('games28'),
		players28 = champiDB.collection('players28'),
		stats28 = champiDB.collection('stats28')


	const statsForOneChamp = async (id = 41) => {

		await u.clearCollection('temp', champiDB)
		await champiDB.command( { create: 'temp', viewOn: 'games28', pipeline: pipe(id) } )

		console.log(`\nGATHERING STATS FOR ${
			championsTable.find(val => val.id === id).name.toUpperCase()
			}\n`)

		console.log(`\nCHAMPION COLLECTION CREATED : ${
			await champiDB.collection('temp').find({}).count()
			} GAMES FOUND \n`)


		const stats = {

			games:
			await champiDB.collection('temp')
				.aggregate([{$count: "counter"}])
				.next()
				.then(data => data.counter),

			wins:
			await champiDB.collection('temp')
				.aggregate([
					{
						$match: {"participants.stats.win": true}
					},
					{
						$count: "counter"
					},
				])
				.next()
				.then(data => data.counter),

			spells:
			await champiDB.collection('temp')
				.aggregate([
					{
						$project: {
							"spells": ["$participants.spell1Id", "$participants.spell2Id"],
							"gameId": 1
						}
					},
					{
						$unwind: "$spells"
					},
					{
						$sort: {"spells": 1}
					},
					{
						$group: {_id: "$gameId", spells: {$push: "$spells"}}
					},
					{
						$sortByCount: "$spells"
					},
				])
				.toArray(),

				items:
				await champiDB.collection('temp')
					.aggregate([
						{
							$project: {
								"items": [
									"$participants.stats.item0",
									"$participants.stats.item1",
									"$participants.stats.item2",
									"$participants.stats.item3",
									"$participants.stats.item4",
									"$participants.stats.item5",
								],
								"gameId": 1
							}
						},
						{
							$unwind: "$items"
						},
						{
							$sort: {"items": 1}
						},
						{
							$group: {_id: "$gameId", items: {$push: "$items"}}
						},
						{
							$sortByCount: "$items"
						},
					])
					.toArray(),

					trinket:
					await champiDB.collection('temp')
						.aggregate([
							{
								$project: {
									"trinket": [
										"$participants.stats.item6",
									]
								}
							},
							{
								$sortByCount: "$trinket"
							},
						])
						.toArray()

		}

		// console.log(`\nAFTER AGGREGATION, HERE ARE THE STATS :\n`,
		// 	`\n\n=> GAMES: \n`,
		// 	stats.games,
		// 	`\n\n=> WINS: \n`,
		// 	stats.wins,
		// 	`\n\n=> SPELLS: \n`,
		// 	stats.spells,
		// 	`\n\n=> ITEMS: \n`,
		// 	stats.items.slice(0,5),
		// 	`\n\n=> TRINKET: \n`,
		// 	stats.trinket,
		// 	`\n\n`,
		// )

		return stats

	}

	var globalStats = []

	for (champion of championsTable) {
		var statsOfThisChamp = await statsForOneChamp(champion.id)
		statsOfThisChamp.id = champion.id
		statsOfThisChamp.name = champion.name

		champiDB.collection('stats31').insert(statsOfThisChamp)	

		globalStats.push(statsOfThisChamp)

		console.log(globalStats)
	}


})()
