const s = require('./server'),
	fetch = require(`node-fetch`),
	u = require('./fn/utils')

// describe(`UTILITIES`, () => {
// })

describe(`API URLS`, () => {
	test(`gameTimeline should return a timeline for this player`, async () => {
		const timeline = await s.gameTimeline(27446952, 3599557458)
		expect(timeline).toEqual(expect.any(Object))
		expect((timeline || {}).frameInterval).toEqual(expect.any(Number))
	})
})
describe(`UTILITIES TEST`, () => {
	test(`fetchAPI should fetch a URL`, () => {
		const url = u.api.summonerByName(`Superben93`)
		return u.fetchAPI(url)
	})
})
