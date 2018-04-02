const
	s = require('./server'),
	fetch = require(`node-fetch`)



describe(`API URLS`, () => {
	test(`summonerByName should return a valid url`, () => {

		const expected = /https:\/\/euw1\.api\.riotgames\.com\/lol\/summoner\/v3\/summoners\/by\-name\/Superben93\?api_key=RGAPI[-a-z0-9]+/
		expect(s.api.summonerByName(`Superben93`)).toMatch(expected)

	})
})

describe(`UTILITIES TEST`, () => {

	test(`fetchAPI should fetch a URL`, () => {
		const url = s.api.summonerByName(`Superben93`)
		return s.fetchAPI(url)
	})


	test(`accFromRid should return an account Object from a regular Id`, () => {
		return s.accFromRid(23316365)
			.then(data => expect(data).toEqual(
				expect.objectContaining({
					'accountId': expect.any(Number)
				})
			))
	})

})
