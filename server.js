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


const saveRecentGames = async (acid, games28) => {
	const recentMatchsFromPlayer = await recentGames(acid)

	u.log(`${recentMatchsFromPlayer.matches.length} games found for this player.
		Sample : \n`, recentMatchsFromPlayer.matches[0])

	const saveTheGames = await crawlGames(recentMatchsFromPlayer.matches, games28)
}


const crawlGames = async (gamesArr, games28) => {
	for(let [index, match] of gamesArr.entries()){
		await gameDetails(match.gameId)
			.then(data => {games28.insert(data); return data})
			.then(data => u.log(u.progressBar(gamesArr, index, data.gameDuration)))
	}
}


const duplicatePlayer = async (acid, players28) => {
	const isDuplicate = await players28
		.find({"accountId": acid})
		.count()
	return isDuplicate
}


// LAUNCHER
const gameCrawler = async (promiseRidArray, db, i = 0) => {

	const ridArray = await promiseRidArray

	const playerAcc = await accFromRid(ridArray[i])

	const playerAcid = playerAcc.accountId

	u.log(`\n\n\nPlayer to crawl = ${playerAcc.name}`)

	const isAlreadyCrawled = await duplicatePlayer(playerAcid, db.players28)

	if (isAlreadyCrawled) {
		u.log(`KNOWN / go next.`)
		gameCrawler(ridArray, db, i+1)
	}
	else
	{
		await saveRecentGames(playerAcid, db.games28)
		await db.players28.insert(playerAcc)
		console.log(`Player inserted in database`)
		gameCrawler(ridArray, db, i+1)
	}
}

const connectChampiDB = champiDB.connect(mongoKey)

connectChampiDB.then(champiDB => {
	gameCrawler(
		masterSummsRid,
		{
			games28: champiDB.db('champiDB').collection('games28'),
			players28: champiDB.db('champiDB').collection('players28'),
		},
		0
	)
})

// TEST SETUP
module.exports = {accFromRid, champIdByName}
