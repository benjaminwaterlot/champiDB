const
	mongoKey = require(`./mongoDbUrl`),
	champiDB = require(`mongodb`).MongoClient,
	u = require(`./utils`),
	connectChampiDB = champiDB.connect(mongoKey)

const summsRidFromLeague = leagueAPI => u.fetchAPI(leagueAPI)
	.then(data => data.entries.map(
		val => val.playerOrTeamId
	))

module.exports = { summsRidFromLeague }
