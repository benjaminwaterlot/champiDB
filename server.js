const
	mongoKey = require(`./mongoDbUrl`),
	champiDB = require(`mongodb`).MongoClient,
	connectChampiDB = champiDB.connect(mongoKey),
	u = require(`./fn/utils`),
	_ = require(`lodash`),
	qualifyTimelineData = require(`./fn/qualifyTimelineData`)


const summsRidFromLeague = leagueAPI => u.fetchAPI(leagueAPI)
	.then(data => data.entries.map(
		val => val.playerOrTeamId
	))
	.catch(err => console.log('\n\nFETCHING OF summsRidFromLeague ABORTED: \n', err))


const accFromRid = rid => u.fetchAPI(u.api.summonerByRid(rid))
	.catch(err => console.log('\n\nFETCHING OF accFromRid ABORTED: \n', err))


// UPDATE HERE TO MODULATE THE 20 OR 100 GAMES
const recentGames = acid => u.fetchAPI(u.api.recentMatchsByAcid(acid))
	.catch(err => console.log('\n\nFETCHING OF recentGames ABORTED: \n', err))

const gameTimeline = (gameId) => u.fetchAPI(u.api.timelineByGameId(gameId))
	.then(data => qualifyTimelineData(data))
	.catch(err => console.log('\n\nFETCHING OF gameTimeline ABORTED: \n', err))


const gameDetails = gameId => u.fetchAPI(u.api.matchByGameId(gameId))
	.then(async gameData => {

		const timelinesArray = (Object.entries(await gameTimeline(gameId)))

		for (const [key, timeline] of timelinesArray) {
			const player = gameData.participants.find(
				participant => participant.participantId.toString() == key
			)
			player['events'] = timeline
		}

		return gameData

	})
	.catch(err => console.log('\n\nFETCHING OF gameDetails ABORTED: \n', err))


const saveRecentGames = async (acid, gameDatabase) => {
	const recentMatchsFromPlayer = (await recentGames(acid)).matches

	u.log(`${recentMatchsFromPlayer.length} games found for this player.`)


	for (let [index, match] of recentMatchsFromPlayer.entries()){
		await gameDetails(match.gameId)
			.then(data => {
				gameDatabase
					.insert(data)
					.then(
						async success => {
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

// LAUNCHER
const gameCrawler = async (promiseRidArray, db, i = 0) => {

	const ridArray = await promiseRidArray
	const playerAcc = await accFromRid(ridArray[i])
	const isAlreadyCrawled = await u.duplicatePlayer(playerAcc, db.players29)

	u.log(`\n\n\nPlayer to crawl = ${playerAcc.name}`)

	if (isAlreadyCrawled) {
		u.log(`KNOWN / go next.`)
		gameCrawler(ridArray, db, i+1)
	}
	else
	{
		await saveRecentGames(playerAcc.accountId, db.games29)
		u.insertPlayer(playerAcc, db.players29)
		gameCrawler(ridArray, db, i+1)
	}
}


connectChampiDB.then(champiDB => {
	gameCrawler(
		summsRidFromLeague(u.api.masterLeagues),
		{
			games29: champiDB.db('champiDB').collection('games29'),
			players29: champiDB.db('champiDB').collection('players29'),
		},
		0
	)
})

// TEST SETUP
module.exports = {accFromRid, gameTimeline}
