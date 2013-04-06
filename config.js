/** Basic configuration */
module.exports = {
	/** Server options */
	server: {
		/** Server port */
		port: process.env.APP_PORT || 8081
	},
	
	/** Redis options */
	redis: {
		credentials: {
			hostname: 'localhost',
			port: 6379,
			password: false, // or a String if auth is used
			db: 5
		}
	}
};
