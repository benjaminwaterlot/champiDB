const MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	s = require('./server'),
	championsTable = require('./champions.json')

const champsArray = s.fetchAPI(s.api.championsApi).then(
	resp => (resp.status || {}).status_code === 429
		? championsTable
		: resp
).then(val => val.data).then(champions => {
	console.log(champions.Malphite.id)
	let championsArr = []
	for (let champion in champions) {
		championsArr.push(
			{id: champions[champion]['id'], name: champions[champion]['name'],}
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
			$addFields: {
				"player": {
					$arrayElemAt: [
						{
							$filter: {
								input: "$participants",
								as: "participant",
								cond: {
									$eq: ["$$participant.championId", id,]
								},
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
														},
													}
												},
												0,
											]
										}
									}, in: {
										$eq: ['$$winnerTeam.teamId', '$player.teamId',]
									},
								}
							},
							_id: 0,
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
							"_id": [
								"$player.spell1Id", "$player.spell2Id",
							],
							"number": {
								$sum: 1
							},
						}
					},
				]
			}
		}, {
			$unwind: "$wins"
		}, {
			$unwind: "$games"
		}, {
			$unwind: "$summonerSpells"
		}
	], {allowDiskUse: true})
	.next()
	.then(aggre => {
		console.log('STATS :', aggre);
		return aggre
	})

	champsArray.then(champions => {
		const stat = async () => {
			var stats = []
			for (champion of champions) {
				console.log(`\n\nstats of ${champion.name} : `)
				await aggreg(champion.id).then(data => stats.push({
					name: champion.name,
					winrate: `${ (data.wins.total / data.games.total * 100).toFixed(1)}%`,
					playRate: `${ (data.games.total / 11000 * 100).toFixed(1)}%`,
					summonerSpells: data.summonerSpells
				}))
			}
			console.log(stats)
			// stats28.remove({})
			stats28.insertMany(stats)
		}
		stat()
	})

})
