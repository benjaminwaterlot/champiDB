const fs = require('fs')
const u = require('../utils')


;(async () => {

	const championsTable = (await u.fetchAPI(u.api.championsApi))

	var championsArray = []

	for (let champion in championsTable.data) {
		championsArray.push(championsTable.data[champion])
	}

	fs.writeFile(
		'static/champions.json',
		JSON.stringify(championsArray, null, 2),
		(err) => err
			? console.log('\n\nERROR WITH FS.WRITEFILE...\n', err)
			: console.log('\n\nDONE ! :-)\nDATA SAMPLE :', championsArray[8])
	)

})()
