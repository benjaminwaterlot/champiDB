const fetch = require(`node-fetch`),
	key = require(`../riotkey.js`),
	addKey = `api_key=${key}`,
	domain = `https://euw1.api.riotgames.com/lol`

const api = {
	masterLeagues: `${domain}/league/v3/masterleagues/by-queue/RANKED_SOLO_5x5?${addKey}`,
	matchByGameId: id => `${domain}/match/v3/matches/${id}?${addKey}`,
	timelineByGameId: id =>
		`${domain}/match/v3/timelines/by-match/${id}?${addKey}`,
	championsApi: `${domain}/static-data/v3/champions?locale=en_US&dataById=false&${addKey}`,
	championById: id =>
		`${domain}/static-data/v3/champions/${id}?locale=en_US&${addKey}`,
	itemsApi: `${domain}/static-data/v3/items?locale=en_US&${addKey}`,
	summonerByName: summName =>
		`${domain}/summoner/v3/summoners/by-name/${summName}?${addKey}`,
	summonerByAcid: accId =>
		`${domain}/summoner/v3/summoners/by-account/${accId}?${addKey}`,
	summonerByRid: id => `${domain}/summoner/v3/summoners/${id}?${addKey}`,
	matchsByAcid: summId =>
		`${domain}/match/v3/matchlists/by-account/${summId}?${addKey}`,
	recentMatchsByAcid: summId =>
		`${domain}/match/v3/matchlists/by-account/${summId}/recent?${addKey}`,
	allMatchsByAcid: summId =>
		`${domain}/match/v3/matchlists/by-account/${summId}?${addKey}`,
}

const fetchAPI = url =>
	fetch(url)
		.then(delayPromise(1100))
		.then(resp => resp.json())
		.then(data => {
			if (!data) {
				log(`fetching this url returned FALSY : ${url}`)
				return
			} else if ((data.status || {}).status_code === (403 || 429 || 404)) {
				log(
					`\n\nFETCHING THIS URL RETURNED A ${
						data.status.status_code
					} STATUS :\n${url}`,
				)
			} else {
				return data
			}
		})
		.catch(error =>
			console.log(`FETCH API HAD A BUG... URL TRIED : ${url}
		\nERROR MESSAGE : ${error}`),
		)

const log = (content, ...s) => {
	console.log(content, ...s)
	return content
}

const delayPromise = delay => data =>
	new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(data)
		}, delay)
	})

const progressBar = (array, currentIndex, gameDuration, status) => {
	var table = '['
	for (let [indMap, val] of array.entries()) {
		indMap > currentIndex
			? (table += '-')
			: indMap === currentIndex && status === 'ko'
				? (table += '/')
				: (table += 'x')
	}
	table += `] ${Math.round(gameDuration / 60)} min`
	return table
}

const duplicatePlayer = async (account, playersDatabase) => {
	const isDuplicate = await playersDatabase
		.find({ accountId: account.accountId })
		.count()
	return isDuplicate
}

const insertPlayer = async (playerAccount, playersDatabase) => {
	await playersDatabase
		.insert(playerAccount)
		.then(delayPromise(10))
		.then(data => {
			console.log(`Player inserted in database`)
		})
}

const clearCollection = async (coll, db) => {
	const alreadyThere = await db.listCollections({ name: coll }).hasNext()
	if (alreadyThere) {
		await db.collection(coll).drop()
	}
	return
}

module.exports = {
	api,
	fetchAPI,
	log,
	progressBar,
	duplicatePlayer,
	insertPlayer,
	clearCollection,
}
