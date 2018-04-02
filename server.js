// DECLARATIONS
const
	fetch = require(`node-fetch`),
	mongoose = require(`mongoose`),
	mongoKey = require(`./mongoDbUrl`),
	champiDB = mongoose.connection,
	key = require(`./riotkey.js`),
	addKey = `api_key=${key}`,
	domain = `https://euw1.api.riotgames.com/lol`,
	api = {
		masterLeagues :
			`${domain}/league/v3/masterleagues/by-queue/RANKED_SOLO_5x5?${addKey}`,
		matchByGameId : id =>
			`${domain}/match/v3/matches/${id}?${addKey}`,
		championsApi :
			`${domain}/static-data/v3/champions?locale=en_US&dataById=false&${addKey}`,
		summonerByName : summName =>
			`${domain}/summoner/v3/summoners/by-name/${summName}?${addKey}`,
		summonerByAcid : accId =>
			`${domain}/summoner/v3/summoners/by-account/${accId}?${addKey}`,
		summonerByRid : id =>
			`${domain}/summoner/v3/summoners/${id}?${addKey}`,
		matchsByAcid : summId =>
			`${domain}/match/v3/matchlists/by-account/${summId}?${addKey}`,
		recentMatchsByAcid : summId =>
			`${domain}/match/v3/matchlists/by-account/${summId}/recent?${addKey}`,
		allMatchsByAcid : summId =>
			`${domain}/match/v3/matchlists/by-account/${summId}?${addKey}`,
	}


// UTILS
const fetchAPI = url => fetch(url)
	.then(delayPromise(1100))
	.then(resp => resp.json())
	.then(data => {

		if (!data) {log(`fetching this url returned FALSY : ${url}`); return}

		else if ((data.status || {}).status_code === (403 || 429 || 404) ) {
			log(`fetching this url returned a ${data.status.status_code} status :
			\n${url}`)
		}

		else {
			// console.log(`fetching done : ${url}`)
			return data
		}
	})
	.catch(error => console.log(`fetchAPI had a bug. URL tried : ${url}
		\nERROR MESSAGE : ${error}`))

const log = (content, ...s) => {console.log(content, ...s); return content}

const delayPromise = delay =>
	data => new Promise((resolve, reject) => {
		setTimeout(() => { resolve(data) }, delay)
	})

const progressBar = (array, currentIndex, gameDuration) => {
	var table = "["
	for(let [indMap, val] of array.entries()){
		indMap > currentIndex ? table += '-' : table += 'x'
	}
	table += `] ${Math.round(gameDuration/60)} min`
	return table
}


// MODULES
const summsRidFromLeague = leagueAPI => fetchAPI(leagueAPI)
	.then(data => data.entries.map(
		val => val.playerOrTeamId
	))

const champIdByName = id => fetchAPI(api.championsApi)
	.then(data => data.data[id].id)

const accFromRid = rid => fetchAPI(api.summonerByRid(rid))


const masterSummsRid = summsRidFromLeague(api.masterLeagues)


// UPDATE HERE TO MODULATE THE 20 OR 100 GAMES
const recentGames = acid => fetchAPI(api.allMatchsByAcid(acid))


const gameDetails = gameId => fetchAPI(api.matchByGameId(gameId))


const crawlGames = async gamesArr => {
	for(let [index, match] of gamesArr.entries()){
		await gameDetails(match.gameId)
			.then(data => {champiDB.collection("games28").insert(data); return data})
			.then(data => log(progressBar(gamesArr, index, data.gameDuration)))
	}
}


const saveRecentGames = async acid => {
	const recentMatchsFromPlayer = await recentGames(acid)
	log(`${recentMatchsFromPlayer.matches.length} games found for this player.
		Sample : \n`, recentMatchsFromPlayer.matches[0])
	const save20Games = await crawlGames(recentMatchsFromPlayer.matches)
}


const duplicatePlayer = async acid => {
	const isDuplicate = await champiDB
		.collection(`players28`)
		.find({"accountId": acid})
		.count()
	return isDuplicate
}


// LAUNCHER
const gameCrawler = async (promiseRidArray, i = 0) => {

	const ridArray = await promiseRidArray

	const playerAcc = await accFromRid(ridArray[i])

	const playerAcid = playerAcc.accountId

	log(`\n\n\nPlayer to crawl = ${playerAcc.name}`)

	const isAlreadyCrawled = await duplicatePlayer(playerAcid)

	if (isAlreadyCrawled) {

		log(`KNOWN / go next.`)
		gameCrawler(ridArray, i+1)

	}	else {

		await saveRecentGames(playerAcid)
		await champiDB.collection(`players28`).insert(playerAcc)
		console.log(`player inserted in database`)
		gameCrawler(ridArray, i+1)

	}

}


gameCrawler(masterSummsRid, 0)


// SETUP
mongoose.connect(mongoKey)
module.exports = {api, fetchAPI, accFromRid, champIdByName}
