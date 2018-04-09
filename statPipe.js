
module.exports = [


	{
		$limit: 10000
	},


	{
		$unwind: "$participants"
	},


	{
		$group: {
			_id: "$participants.championId",
			game: {$push: "$participants"},
		}
	},


	// {
	// 	$project: {
	//
	// 		"wins": {
	// 			$reduce: {
	// 				input: "$game.stats.win",
	// 				initialValue: 0,
	// 				in: {$add: [
	// 					"$$value",
	// 					{$cond: {if: {$eq: ["$$this", true]}, then: 1, else: 0}}
	// 					]
	// 				}
	// 			}
	// 		},
	//
	// 		"spells": {
	// 			$reduce: {
	// 				input: "$game",
	// 				initialValue: [],
	// 				in: {
	// 					$concatArrays: ["$$value", [
	// 						[
	// 							"$$this.spell1Id",
	// 							"$$this.spell2Id",
	// 						]
	// 					]]
	// 				}
	// 			}
	// 		},
	//
	// 		"items": {
	// 			$reduce: {
	// 				input: "$game.stats",
	// 				initialValue: [],
	// 				in: {
	// 					$concatArrays: ["$$value", [
	// 						[
	// 							"$$this.item1",
	// 							"$$this.item2",
	// 							"$$this.item3",
	// 							"$$this.item4",
	// 							"$$this.item5",
	// 							"$$this.item6",
	// 						]
	// 					]]
	// 				}
	// 			}
	// 		},
	//
	// 		"runes": {
	// 			$reduce: {
	// 				input: "$game.stats",
	// 				initialValue: [],
	// 				in: {
	// 					$concatArrays: ["$$value",[
	// 						[
	// 							"$$this.perk0",
	// 							"$$this.perk1",
	// 							"$$this.perk2",
	// 							"$$this.perk3",
	// 							"$$this.perk4",
	// 						]
	// 					]]
	// 				}
	// 			}
	// 		},
	//
	// 		"kda": {
	// 			$reduce: {
	// 				input: "$game.stats",
	// 				initialValue: [],
	// 				in: {
	// 					$concatArrays: ["$$value", [
	// 						{
	// 							kills: "$$this.kills",
	// 							deaths: "$$this.deaths",
	// 							assists: "$$this.assists",
	// 						}
	// 					]]
	// 				}
	// 			}
	// 		},
	//
	// 		"role": {
	// 			$reduce: {
	// 				input: "$game.timeline",
	// 				initialValue: [],
	// 				in: {
	// 					$concatArrays: ["$$value", [
	// 						{
	// 							role: "$$this.role",
	// 							lane: "$$this.lane",
	// 						}
	// 					]]
	// 				}
	// 			}
	// 		}
	//
	// 	}
	// },


]
