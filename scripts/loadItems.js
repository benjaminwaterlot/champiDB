const fs = require('fs')
const u = require('../fn/utils')


;(async () => {

	const itemsTable = (await u.fetchAPI(u.api.itemsApi)).data

	fs.writeFile(
		'static/items.json',
		JSON.stringify(itemsTable, null, 2),
		(err) => err
			? console.log('\n\nERROR WITH FS.WRITEFILE...\n', err)
			: console.log('\n\nDONE ! :-)\nDATA SAMPLE :', itemsTable["1011"])
	)

})()
