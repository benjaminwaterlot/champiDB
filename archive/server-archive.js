const
	fetch = require(`node-fetch`),
	mongoose = require(`mongoose`),
	mongoKey = require(`./mongoDbUrl`),
	champiDB = mongoose.connection,
	key = `RGAPI-b33e8cc5-9540-499b-9918-0b64cfc90408`,
	addKey = `?api_key=${key}`,
	domain = `https://euw1.api.riotgames.com/lol`,
	api = {
		masterLeagues :
			`${domain}/league/v3/masterleagues/by-queue/RANKED_SOLO_5x5${addKey}`,
		matchById : id =>
			`${domain}/match/v3/matches/${id}${addKey}`,
		summonerByName : summName =>
			`${domain}/summoner/v3/summoners/by-name/${summName}${addKey}`,
		summonerByAccount : accId =>
			`${domain}/summoner/v3/summoners/by-account/${accId}${addKey}`,
		summonerById : id =>
			`${domain}/summoner/v3/summoners/${id}${addKey}`,
		matchBySummAccId : summId =>
			`${domain}/match/v3/matchlists/by-account/${summId}${addKey}`,
		recentMatchBySummAccId : summId =>
			`${domain}/match/v3/matchlists/by-account/${summId}/recent${addKey}`,
	}

const fetchSafe = url => fetch(url).then(resp => resp.json())

const delayPromise = delay =>
	data => new Promise((resolve, reject) => {
			setTimeout(() => { resolve(data) }, delay)
		})

const displayProgressBar = (array, currentIndex) => {
	var table = "["
	for([indMap, val] of array){indMap > currentIndex ? table += '-' : table += 'x'}
	table += "]"
	return table
}


mongoose.connect(mongoKey)

// NEW FUNCTION
const idFromLeagueEndpoint = (leagueApi, i) => fetch(`${leagueApi}`)
	.then(resp => resp.json())
	.then(data => data.entries[i].playerOrTeamId)
	.catch(err => {console.error(err)})

const crawlGames = async (gamesArr) => {
	for(let [index, game] of gamesArr.entries()){
		await fetch(api.matchById(game.gameId))
			.then(resp => resp.json())
			.then(delayPromise(1250))
			.then(data => {champiDB.collection(`mastertest2`).insert(data); return data})
			.then(data => {console.log(displayProgressBar(gamesArr.entries(), index))})
	}
}

const returnLastGames = (ep, i = 0) =>
	idFromLeagueEndpoint(ep, i)
		.then(id => fetch(`${api.summonerById(id)}`))
		.then(resp => resp.json())
		.then(data => {console.log(`\n\n\nNEXT SUMMONER TO CRAWL is N°${i}: ${data.name}\n`, data); return data})
		.then(async data => {
			const isDuplicate = await champiDB.collection(`masterplayers`).find({"id": data.id}).count()
			return isDuplicate ? returnLastGames(ep, i+1) : data
		})
		.then(data => {champiDB.collection(`masterplayers`).insert(data); return data})
		.then(data => fetch(api.recentMatchBySummAccId(data.accountId)))
		.then(resp => resp.json())
		.then(data => crawlGames(data.matches))
		.then(data => returnLastGames(ep, i+1))

returnLastGames(api.masterLeagues)

module.exports = {idFromLeagueEndpoint, crawlGames, returnLastGames, displayProgressBar, fetchSafe}


// KEY :
// ./mongo "mongodb://champidb-shard-00-00-cegcr.mongodb.net:27017,champidb-shard-00-01-cegcr.mongodb.net:27017,champidb-shard-00-02-cegcr.mongodb.net:27017/games?replicaSet=champiDB-shard-0" --ssl --authenticationDatabase admin --username Superben93 --password iqrfn6GD93
