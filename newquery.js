const MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	s = require('./server'),
	championsTable = require('./static/champions.json')

MongoClient.connect(mongoKey, (err, client) => {

	const games28 = client.db('champiDB').collection('games28')
	const players28 = client.db('champiDB').collection('players28')
	const stats28 = client.db('champiDB').collection('stats28')

	const totalGames = games28.find({}).count().then(
		total => console.log(`Total games saved : ${total}`)
	)

	const aggregation = games28.aggregate([
		{$limit: 1000},
		{$project: {participants: true}},
		{$unwind: "$participants"},
		{$replaceRoot: {newRoot: "$participants"}},
		{$group: {
			_id: "$championId",
			gamesPlayed: {$sum: 1},
			wins: {$sum: {$cond: {if: {$eq: ["$stats.win", true]}, then: 1, else: 0}}},
			losses: {$sum: {$cond: {if: {$eq: ["$stats.win", false]}, then: 1, else: 0}}},
			summonerSpells: {$push: {summ1: "$spell1Id", summ2: "$spell2Id"}},
			items: {$push: {
				item0: "$stats.item0",
				item1: "$stats.item1",
				item2: "$stats.item2",
				item3: "$stats.item3",
				item4: "$stats.item4",
				item5: "$stats.item5",
				item6: "$stats.item6"
			}},
		}},
		// {$sort: {"count": -1}},
	])
	.toArray()
	.then(res => res)

	aggregation
		.then(data => {stats28.remove({}); return data})
		.then(data => {stats28.insertMany(data)})
		// .then(data => data.map(val => console.log(val)))

})
