const MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	u = require('./utils'),
	championsTable = require('./champions.json')

const champsArray = u.fetchAPI(u.api.championsApi).then(
	resp => (resp.status || {}).status_code === 429
		? championsTable
		: resp
).then(val => val.data).then(champions => {
	console.log(champions.Malphite.id)
	let championsArr = []
	for (let champion in champions) {
		championsArr.push(
			{id: champions[champion]['id'], name: champions[champion]['name']
			}
		)
	}
	return championsArr
}).then(data => {
	console.log(data);
	return data
})

MongoClient.connect(mongoKey, (err, client) => {

	const games28 = client.db('champiDB').collection('games28')
	const players28 = client.db('champiDB').collection('players28')
	const stats28 = client.db('champiDB').collection('stats28')

	const totalGames = games28.find({}).count().then(
		total => console.log(`Total games saved : ${total}`)
	)

	const aggreg = (id) => games28.aggregate([
		{
			$match: {
				'participants.championId': id
			}
		}, {
			$limit: 100
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
				// "items": [
				// 	{}
				// ],
			}
		}, {
			$unwind: "$wins"
		}, {
			$unwind: "$games"
		},
	], {allowDiskUse: true}).next().then(aggre => u.log(aggre))

	// const testAggregation = (() => aggreg(51).then(async data => {
	//
	// 	await stats28.remove({}) 	stats28.insert(data)
	//
	// }))()

	champsArray.then(champions => {
		const stat = async () => {
			const numberOfGames = await games28.find({}).count()
			var stats = []
			for (champion of champions) {
				console.log(`\n\nstats of ${champion.name} :`)
				await aggreg(champion.id).then(
					data => stats.push({
						name: champion.name,
						winrate: `${ (data.wins.total / data.games.total * 100).toFixed(1)}%`,
						playRate: `${ (data.games.total / numberOfGames * 100).toFixed(1)}%`,
						summonerSpells: data.summonerSpells,
					})
				)
			}
			console.log(stats)
			await stats28.remove({})
			await stats28.insertMany(stats)
		}
		stat()
	})

})
