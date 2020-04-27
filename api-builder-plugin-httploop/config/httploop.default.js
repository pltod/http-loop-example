module.exports = {
	pluginConfig: {
		'api-builder-plugin-httploop': {
			// These are by default. Change them if you need to.
			// insecureSSL: false,
			// followRedirect: true

			// Limmit your concurrent requests
			// concurrencyRequests: 50

			// `auto` - decodes response (default)
			// `buffer` - return response as Buffer
			// rawBuffer: 'auto|buffer'
		}
	}
};
