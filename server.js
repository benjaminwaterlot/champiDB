const mongoKey = require(`./mongoDbUrl`).default.default,
	champiDB = require(`mongodb`).MongoClient,
	connectChampiDB = champiDB.connect(mongoKey),
	u = require(`./fn/utils`),
	_ = require(`lodash`),
	qualifyTimelineData = require(`./fn/qualifyTimelineData`)

const summsRidFromLeague = leagueAPI =>
	u
		.fetchAPI(leagueAPI)
		.then(data => data.entries.map(val => val.playerOrTeamId))
		.catch(err =>
			console.log('\n\nFETCHING OF summsRidFromLeague ABORTED: \n', err),
		)

const accFromRid = rid =>
	u
		.fetchAPI(u.api.summonerByRid(rid))
		.catch(err => console.log('\n\nFETCHING OF accFromRid ABORTED: \n', err))

const recentGames = acid =>
	u
		.fetchAPI(u.api.matchsByAcid(acid))
		.catch(err => console.log('\n\nFETCHING OF recentGames ABORTED: \n', err))

const gameTimeline = gameId =>
	u
		.fetchAPI(u.api.timelineByGameId(gameId))
		.then(data => qualifyTimelineData(data))
		.catch(err => console.log('\n\nFETCHING OF gameTimeline ABORTED: \n', err))

const gameDetails = gameId =>
	u
		.fetchAPI(u.api.matchByGameId(gameId))
		.then(async gameData => {
			const timelinesArray = Object.entries(await gameTimeline(gameId))

			for (const [key, timeline] of timelinesArray) {
				const player = gameData.participants.find(
					participant => participant.participantId.toString() == key,
				)
				player['events'] = timeline
			}

			return gameData
		})
		.catch(err => {
			console.log('\n\nFETCHING OF gameDetails ABORTED: \n', err)
		})

const saveRecentGames = async (acid, gameDatabase) => {
	const recentMatchsFromPlayer = (await recentGames(acid)).matches

	console.log(`${recentMatchsFromPlayer.length} games found for this player.`)

	for (let [index, match] of recentMatchsFromPlayer.entries()) {
		await gameDetails(match.gameId).then(data => {
			if (!data) return
			gameDatabase.insert(data).then(
				success => {
					console.log(
						u.progressBar(
							recentMatchsFromPlayer,
							index,
							data.gameDuration,
							'ok',
						),
					)
				},
				failure => {
					failure.code === 11000
						? console.log(u.progressBar(recentMatchsFromPlayer, index, 0, 'ko'))
						: console.log('ERROR ON INSERTION IN DB, CODE : ', failure.code)
				},
			)
			return data
		})
	}
}

const gameCrawler = async (promiseRidArray, db, i = 0) => {
	const ridArray = await promiseRidArray
	const playerAcc = await accFromRid(ridArray[i])
	const playerAlreadyDone = await u.duplicatePlayer(playerAcc, db.players)

	console.log(`\n\n\nPLAYER TO CRAWL = ${playerAcc.name}`)

	if (playerAlreadyDone) {
		console.log(`KNOWN / go next.`)
		gameCrawler(ridArray, db, i + 1)
	} else {
		await saveRecentGames(playerAcc.accountId, db.games)
		u.insertPlayer(playerAcc, db.players)
		gameCrawler(ridArray, db, i + 1)
	}
}

connectChampiDB.then(champiDB => {
	gameCrawler(summsRidFromLeague(u.api.masterLeagues), {
		games: champiDB.db('champiDB').collection('games29'),
		players: champiDB.db('champiDB').collection('players29'),
	})
})

module.exports = { accFromRid, gameTimeline }
