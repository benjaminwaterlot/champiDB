const
	mongoose = require(`mongoose`),
	mongoKey = require(`./mongoDbUrl`),
	champiDB = mongoose.connection

mongoose.connect(mongoKey)

const cleanDB = async (collection) => {
	const remove = await champiDB.collection(collection).remove(
		{},
		function(err, data){console.log(`deleted ${data.result.n} docs`)}
	)
}

cleanDB(`games28`)
