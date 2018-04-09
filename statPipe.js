


const pipeOfChamp = (id) => [
	{
		$match: {"participants.championId": id, "gameMode": "CLASSIC", "queueId": 420}
	},
	{
		$unwind: "$participants"
	},
	{
		$match: {"participants.championId": id}
	}
]



module.exports = pipeOfChamp
