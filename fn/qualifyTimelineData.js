const _ = require ('lodash')

const qualifyTimelineData = timelineData => {

	const timelineFrames = timelineData.frames

	const emptyEvents = {}
	for (var i = 1; i <= 10; i++) {
		emptyEvents[i] = {}
		emptyEvents[i].items = []
		emptyEvents[i].skills = []
	}

	const playerEvents = _.reduce(
		timelineData.frames,
		(events, frame) => {
			for (event of frame.events) {

				if (event.type === 'ITEM_PURCHASED') {
					events[event.participantId.toString()].items.push({
						itemId: event.itemId,
						timestamp: event.timestamp
					})
				}

				if (event.type === 'ITEM_UNDO' && event.beforeId !== 0) {
					const playerItems = events[event.participantId.toString()].items
					const deleted = _.last(playerItems.filter(item => item.itemId === event.beforeId))
					_.pullAt(playerItems, _.lastIndexOf(playerItems, deleted))
				}

				if (event.type === 'SKILL_LEVEL_UP') {
					events[event.participantId.toString()].skills.push({
						skillSlot: event.skillSlot,
						timestamp: event.timestamp
					})
				}

			}
			return events
		},
		emptyEvents
	)
	// console.log("returning this ", playerEvents)

	return (playerEvents)
}


module.exports = qualifyTimelineData
