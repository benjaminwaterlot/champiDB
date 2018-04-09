const
	MongoClient = require(`mongodb`).MongoClient,
	mongoKey = require(`./mongoDbUrl`),
	u = require('./utils'),
	championsTable = require('./champions.json'),
	pipe = require('./statPipe')

;(async () => {

	const client = await MongoClient.connect(mongoKey)

	const
		champiDB = client.db('champiDB'),
		games28 = champiDB.collection('games28'),
		players28 = champiDB.collection('players28'),
		stats28 = champiDB.collection('stats28')

	const statsView = (async () => {

		const stats = await champiDB.collection('games28').aggregate(pipe, {allowDiskUse: true}).toArray()
		console.log(stats)
		await u.clearCollection('stats30', champiDB)
		await champiDB.command( { create: 'stats30', viewOn: 'games28', pipeline: pipe } )

	})()
})()
