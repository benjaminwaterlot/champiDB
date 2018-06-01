const MongoClient = require(`mongodb`).MongoClient
const mongoKey = require(`./../mongoDbUrl`)
const u = require('./../fn/utils')
const _ = require('lodash')
//
;(async () => {
	const champiDB = (await MongoClient.connect(mongoKey)).db('champiDB')

	const TOP = {
		$and: [
			{ $eq: ['$timeline.role', 'SOLO'] },
			{ $eq: ['$timeline.lane', 'TOP'] },
		],
	}

	const JUNGLE = {
		$and: [
			{ $eq: ['$timeline.role', 'NONE'] },
			{ $eq: ['$timeline.lane', 'JUNGLE'] },
		],
	}

	const MID = {
		$and: [
			{ $eq: ['$timeline.role', 'SOLO'] },
			{ $eq: ['$timeline.lane', 'MIDDLE'] },
		],
	}

	const ADC = {
		$and: [
			{ $eq: ['$timeline.role', 'DUO_CARRY'] },
			{ $eq: ['$timeline.lane', 'BOTTOM'] },
		],
	}

	const SUPPORT = {
		$and: [
			{ $eq: ['$timeline.role', 'DUO_SUPPORT'] },
			{ $eq: ['$timeline.lane', 'BOTTOM'] },
		],
	}

	const addPosition = [
		{
			$addFields: {
				position: {
					$switch: {
						branches: [
							{
								case: TOP,
								then: 'TOP',
							},
							{
								case: JUNGLE,
								then: 'JUNGLE',
							},
							{
								case: MID,
								then: 'MID',
							},
							{
								case: ADC,
								then: 'ADC',
							},
							{
								case: SUPPORT,
								then: 'SUPPORT',
							},
						],
						default: 'NONE',
					},
				},
			},
		},
	]

	const clear = await u.clearCollection('players000', champiDB)

	const aggregate = await champiDB
		.collection('players400')
		.aggregate([
			// { $limit: 400 },
			...addPosition,
			{ $out: 'players000' },
		])
		.toArray()

	console.log(_.take(aggregate, 10))
})()
