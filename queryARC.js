const
	MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	u = require('./utils'),
	championsTable = require('./static/champions.json')


const champsArray = u.fetchAPI(u.api.championsApi)
	.then(resp => (resp.status || {}).status_code === 429 ? championsTable : resp)
	.then(val => val.data)
	.then(champions => {
		let championsArr = []
		for (let champion in champions) {
			championsArr.push(
				{id: champions[champion]['id'], name: champions[champion]['name']
				}
			)
		}
		return championsArr
	})
	.then(data => {
		console.log(`\n\nSAMPLE CHAMPIONS :\n`, data.slice(0, 5))
		return data
	});



(async () => {

	const client = await MongoClient.connect(mongoKey)

	const
		champiDB = client.db('champiDB'),
		games28 = champiDB.collection('games28'),
		players28 = champiDB.collection('players28'),
		stats28 = champiDB.collection('stats28')

	const logTotalGames = games28.find({}).count().then(
		total => console.log(`\n\nTotal games saved : ${total}`)
	)




	const legacyPipeline = (id) => [
		{
			$match: {
				'participants.championId': id
			}
		}, {
			$addFields: {
				"player": {
					$arrayElemAt: [
						{
							$filter: {
								input: "$participants",
								as: "participant",
								cond: {
									$eq: ["$$participant.championId", id,]
								}
							}
						},
						0,
					]
				}
			}
		}, {
			$facet: {
				"wins": [
					{
						$project: {
							win: {
								$let: {
									vars: {
										winnerTeam: {
											$arrayElemAt: [
												{
													$filter: {
														input: "$teams",
														as: "team",
														cond: {
															$eq: ["$$team.win", "Win",]
														}
													}
												},
												0,
											]
										}
									}, in: {
										$eq: ['$$winnerTeam.teamId', '$player.teamId',]
									}
								}
							},
							_id: 0
						}
					}, {
						$match: {
							'win': false
						}
					}, {
						$count: 'total'
					},
				],
				"games": [
					{
						$count: 'total'
					}
				],
				"summonerSpells": [
					{
						$group: {
							_id: {
								spell1: "$player.spell1Id",
								spell2: "$player.spell2Id"
							},
							s1: {$first: "$player.spell1Id"},
							s2: {$first: "$player.spell2Id"},
							count: {
								$sum: 1
							},
						}
					}
				],
			}
		}, {
			$unwind: "$wins"
		}, {
			$unwind: "$games"
		},
	]



	const groupByChampion = [
		{$limit: 500},
		{$unwind: "$participants"},
		{$group: {
			_id: "$participants.championId",
			count: {$sum: 1},
			game: {$push: "$participants"},
			summs: {$push: {summ: ["$participants.spell1Id", "$participants.spell2Id"]}}}
		}
	]

	const aggreg = (id) => games28.aggregate(legacyPipeline(id), {allowDiskUse: true}).next().then(aggre => u.log(aggre))

	const existingColl = await champiDB.listCollections({ name: 'champions28' }).hasNext()
	if (existingColl) await champiDB.collection('champions28').drop()

	await champiDB.command( { create: 'champions28', viewOn: 'games28', pipeline: groupByChampion } )
	console.log("DONE")

	// champsArray.then(async champions => {
	// 	const numberOfGames = await games28.find({}).count()
	// 	var stats = []
	// 	for (champion of champions.slice(0, 3)) {
	// 		console.log(`\n\nSTATS OF ${champion.name.toUpperCase()} :`)
	// 		await aggreg(champion.id).then(
	// 			data => stats.push({
	// 				name: champion.name,
	// 				winrate: `${ (data.wins.total / data.games.total * 100).toFixed(1)}%`,
	// 				playRate: `${ (data.games.total / numberOfGames * 100).toFixed(1)}%`,
	// 				summonerSpells: data.summonerSpells,
	// 			})
	// 		)
	// 	}
	// 	console.log(`\n\nSAMPLE RESULTS :\n==================\n`, stats.slice(0, 3))
	// 	await stats28.remove({})
	// 	await stats28.insertMany(stats)
	// })

})()
