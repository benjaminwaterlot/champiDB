const
	s = require('./server2'),
	u = require('./utils'),
	fetch = require(`node-fetch`)


// describe(`UTILITIES`, () => {
// })

describe(`FETCHING MODULES`, () => {
	test(`masterLeagues should be a URL`, function coucou () {
		expect(u.api.masterLeagues).toEqual(expect.any(String))
		expect(u.api.masterLeagues).toMatch(/http/)
		expect(u.api.masterLeagues).toMatch(/RGAPI-/)
	})

	test(`summsRidFromLeague should return Rids from LeagueAPI`, (coucou) => {

		expect(s.summsRidFromLeague(coucou)).toEqual(expect.any(Array))

	})
})
