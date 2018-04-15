const
	express = require(`express`),
	app = express(),
	jsonfile = require(`jsonfile`),
	_ = require(`lodash`),
	fs = require(`fs`),
	fetch = require(`node-fetch`),
	mongoose = require(`mongoose`),
	mongoDB = `mongodb://Superben93:iqrfn6GD93@champidb-shard-00-00-cegcr.mongodb.net:27017,champidb-shard-00-01-cegcr.mongodb.net:27017,champidb-shard-00-02-cegcr.mongodb.net:27017/games?ssl=true&replicaSet=champiDB-shard-0&authSource=admin`,
	db = mongoose.connection,
	key = `RGAPI-c9f2edb1-5889-4ccf-a4bd-9be29e013f63`,
	domain = `https://euw1.api.riotgames.com/lol`,
	api = {
		masterLeagues : `${domain}/league/v3/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${key}`,
		matchById : `${domain}/match/v3/matches/`,
		summonerByName : (summName) => `${domain}/summoner/v3/summoners/by-name/${summName}`,
		summonerByAccount : (accId) => `${domain}/summoner/v3/summoners/${accId}?api_key=${key}`,
		matchBySummId : (summId) => `${domain}/match/v3/matchlists/by-account/${summId}?api_key=${key}`,
	},
	summoner = `Superben93`,
	summonerId = `27446952`

	const delayPromise = (delay) => {
		return function(data) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					resolve(data)
				}, delay)
			})
		}
	}
	const promiseSerial = fetchingUrlsPromise =>
		fetchingUrlsPromise.reduce((promise, func) =>
			promise.then(result => func().then(Array.prototype.concat.bind(result))),
			Promise.resolve([])
		)


mongoose.connect(mongoDB, (err, db) => {

	const findMasterSummsIds = () => fetch(`${api.masterLeagues}`)
		.then(resp => resp.json())
		.then(data => data.entries.map(val => val.playerOrTeamId))

	// const arrayOfPromises = findMasterSummsIds()
	// 	.then(data => data.entries.map(val => () =>
	// 		fetch(`${api.summonerByAccount(val.playerOrTeamId)}`)
	// 			.then(resp => resp.json())
	// 			.then(data => console.log(`fetched ${api.summonerByAccount(val.playerOrTeamId)}`))
	// 	))

	// const arrayOfPromises = () => findMasterSummsIds()
	// 	.then( data => data
	// 		.map(val => () =>
	// 			fetch(`${api.summonerByAccount(val.playerOrTeamId)}`)
	// 				.then(resp => resp.json())
	// 		)
	// 	)

	const download = () => findMasterSummsIds()
		.then( data => {
			async function readFiles(data) {
				for(summAccId of data) {
					await fetch(`${api.summonerByAccount(summAccId)}`)
						.then(delayPromise(0))
						.then(resp => resp.json())
						.then(data => {db.collection(`masterplayers`).insert(data); console.log(data)})
				}
			}
			readFiles(data)
			}
		)

	download()

		// arrayOfPromises().then( data =>
		// 	{console.log(data)}
		// )
	// promiseSerial(arrayOfPromises)
	// 	.then(console.log.bind(console))
	// 	.catch(console.error.bind(console))








		// const findSummByAccId = findMasterSummsIds
		// 	.then(summsAccId => fetch(`${api.summonerByAccount(summsAccId[0])}`))
		// 	.then(resp => resp.json())
		// 	// .then(data => {console.log(data); return data})
		// 	.then(data => db.collection(`doctest`).insert({name: 'test', name: data.name}))

	})


// const delayPromise = (delay) => {
// 	return function(data) {
// 		return new Promise(function(resolve, reject) {
// 			setTimeout(function() {
// 				resolve(data)
// 			}, delay)
// 		})
// 	}
// }
//

// const fetchingUrlsPromise = (urlArr) => urlArr.map(url => () => fetch(url)
// 	.then(resp => resp.json())
// 	.then(delayPromise(1250))
// 	.then(data => {
// 		console.log(`Loading a game of ${Math.round(data.gameDuration / 60)} minutes at ${(new Date()).toUTCString()}.`)
// 		return data
// 	})
// 	.then(data => db.collection(`patch_8_5`).insert(data))
// )
//
//
// starter(7)
//
//
// async function starter(i){
//
// 	const findMasterSummsIds = await fetch(`${api.masterLeagues}`)
// 		.then(resp => resp.json())
// 		.then(data => data.entries.map(val => val.playerOrTeamId))
//
// 	const findSummIdByAccId = await fetch(`${api.summonerByAccount(findMasterSummsIds[i])}`)
// 		.then(resp => resp.json())
// 		.then(data => {
// 			console.log(`WE WILL FIND MATCHS FOR`,data.name)
// 			return data
// 		})
//
// 	const findGamesBySummId = await fetch(`${api.matchBySummId(findSummIdByAccId.accountId)}`)
// 		.then(resp => resp.json())
// 		.then(data => {
// 			var Ids = []
// 			data.matches.map(val => Ids.push(val.gameId))
// 			return Ids
// 		})
//
// 	const urlArr = findGamesBySummId.map(val => {
// 		return `${api.matchById}${val}?api_key=${key}`
// 	})
//
// 	mongoose.connect(mongoDB, (err, db) => {
// 		db.on(`error`, console.error.bind(console, `MongoDB connection error`))
// 		console.log(`Connected to MongoDB`)
// 		promiseSerial(fetchingUrlsPromise(urlArr))
// 			.then(console.log.bind(console))
// 			.catch(console.error.bind(console))
// 	})
// }
