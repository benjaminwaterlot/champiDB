// DECLARATIONS
const
	mongoKey = require(`./mongoDbUrl`),
	champiDB = require(`mongodb`).MongoClient,
	u = require(`./utils`)

// UTILS


// MODULES
const summsRidFromLeague = leagueAPI => u.fetchAPI(leagueAPI)
	.then(data => data.entries.map(
		val => val.playerOrTeamId
	))


const champIdByName = id => u.fetchAPI(u.api.championsApi)
	.then(data => data.data[id].id)


const accFromRid = rid => u.fetchAPI(u.api.summonerByRid(rid))


const masterSummsRid = summsRidFromLeague(u.api.masterLeagues)


// UPDATE HERE TO MODULATE THE 20 OR 100 GAMES
const recentGames = acid => u.fetchAPI(u.api.recentMatchsByAcid(acid))


const gameDetails = gameId => u.fetchAPI(u.api.matchByGameId(gameId))


const saveRecentGames = async (acid, gameDatabase) => {
	const recentMatchsFromPlayer = (await recentGames(acid)).matches

	u.log(`${recentMatchsFromPlayer.length} games found for this player.`)

	for(let [index, match] of recentMatchsFromPlayer.entries()){
		await gameDetails(match.gameId)
			.then(data => {
				gameDatabase
					.insert(data)
					.then(
						success => {
							console.log(u.progressBar(recentMatchsFromPlayer, index, data.gameDuration, 'ok'))
						},
						failure => {
							failure.code === 11000
								? console.log(u.progressBar(recentMatchsFromPlayer, index, 0, 'ko'))
								: console.log('ERROR ON INSERTION IN DB, CODE : ', failure.code)
						}
					)
				return data
			})
	}

}


const duplicatePlayer = async (acid, playersDatabase) => {
	const isDuplicate = await playersDatabase
		.find({"accountId": acid})
		.count()
	return isDuplicate
}


// LAUNCHER
const gameCrawler = async (promiseRidArray, db, i = 0) => {

	const ridArray = await promiseRidArray
	const playerAcc = await accFromRid(ridArray[i])
	const playerAcid = playerAcc.accountId
	const isAlreadyCrawled = await duplicatePlayer(playerAcid, db.players29)

	u.log(`\n\n\nPlayer to crawl = ${playerAcc.name}`)

	if (isAlreadyCrawled) {
		u.log(`KNOWN / go next.`)
		gameCrawler(ridArray, db, i+1)
	}
	else
	{
		await saveRecentGames(playerAcid, db.games29)
		await db.players29.insert(playerAcc)

		console.log(`Player inserted in database`)

		gameCrawler(ridArray, db, i+1)
	}
}

const connectChampiDB = champiDB.connect(mongoKey)

connectChampiDB.then(champiDB => {
	gameCrawler(
		masterSummsRid,
		{
			games29: champiDB.db('champiDB').collection('games29'),
			players29: champiDB.db('champiDB').collection('players29'),
		},
		0
	)
})

// TEST SETUP
module.exports = {accFromRid, champIdByName}
