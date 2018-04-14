const
	s = require('./server'),
	fetch = require(`node-fetch`),
	u = require('./fn/utils')



describe(`API URLS`, () => {
	test(`gameTimeline should return a timeline for this player`, async () => {
		const timeline = await s.gameTimeline(27446952, 3599557458)
		expect(timeline).toEqual(expect.any(Object))
		expect((timeline||{}).frameInterval).toEqual(expect.any(Number))
	})
})

describe(`UTILITIES TEST`, () => {

	test(`fetchAPI should fetch a URL`, () => {
		const url = u.api.summonerByName(`Superben93`)
		return u.fetchAPI(url)
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
