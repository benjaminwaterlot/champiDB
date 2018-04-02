const
	s = require(`./server`),
	q = require (`./query`)


describe(`QUERIES`, () => {

	beforeEach(() => {
		q.mongoose.connect(q.mongoKey)
	})

	test(`champIdByName should return an ID from a name`, () => {

		return s.champIdByName('Caitlyn').then(data => expect(data).toBe(51))

	})

	test(`numberOfGames should return the number of games from a champion's Id`, () => {

		return q.numberOfGames(51).then(data => expect(data).toEqual(expect.any(Number)))

	})

})
