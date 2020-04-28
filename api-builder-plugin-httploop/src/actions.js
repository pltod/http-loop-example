const requester = require("@axway/requester");
const placeholderRgx = /{([^}]+)}/g;
const placeholderApiKeyRgx = /{apiKey}/g;

async function request(req, outputs, { logger }) {
	const { url, method, headers, body, urlValues } = req.params;
	const apiKey = req.authorizations && req.authorizations.apiKey;
	const hdrs = fillAPIKey(headers, apiKey);
	let location = url;
	if (urlValues) {
		if (typeof urlValues === 'string') {
			location = constructUrlFromString(url, urlValues, logger);
		} else if (Array.isArray(urlValues)) {
			location = constructUrlFromArray(url, urlValues, logger);
		} else {
			// urlValues are defined in Object
			location = constructUrlFromObject(url, urlValues, logger);
		}
	}
	let results;
	try {
		results = await requester(location, hdrs, method || 'get', body);
	} catch (ex) {
		return outputs.error(null, ex.message);
	}
	return outputs.next(null, results);
}

async function loop(req, outputs, { logger, pluginConfig }) {
	const { url, loopOver: data, method, headers, body } = req.params;
	const action = method || 'get';
	const apiKey = req.authorizations && req.authorizations.apiKey;
	const { concurrencyRequests } = pluginConfig;
	const hdrs = fillAPIKey(headers, apiKey);

	if (!Array.isArray(data) || !(data.length > 0)) {
		logger.trace('Loop requested on empty data!');
		return outputs.next(null, []);
	} else {
		const urlType = getUrlType(data, outputs, logger);
		let results = [];
		if (concurrencyRequests) {
			const dataFragmentCount = Math.ceil(data.length / concurrencyRequests);
			for (let i = 0; i < dataFragmentCount; i++) {
				const start = i * concurrencyRequests;
				const dataFragment = data.slice(start, start + concurrencyRequests);
				const requests = dataFragment.map((entry) => {
					return execute(entry, url, urlType, hdrs, action, body, logger);
				});
				let dataFragmentResults;
				try {
					dataFragmentResults = await Promise.all(requests);
				} catch (ex) {
					return outputs.error(null, ex.message);
				}
				results = results.concat(dataFragmentResults);
			}
		} else {
			const requests = data.map((entry) => {
				return execute(entry, url, urlType, hdrs, action, body, logger);
			});
			results = await Promise.all(requests);
		}
		return outputs.next(null, results);
	}
}

async function execute(entry, url, urlType, hdrs, method, body, logger){
	let location;
	if (urlType === 'multipleParameters') {
		location = constructUrlFromObject(url, entry, logger);
	} else {
		location = constructUrlFromString(url, entry, logger);
	}
	logger.trace(location);
	return requester(location, hdrs, method || 'get', body);
}

function getUrlType(data, outputs, logger) {
	// Denotes if we parse URL with single or multiple params
	if (typeof data[0] === 'string') {
		logger.trace('Loop requested on collection of strings! URL must have only 1 parameter');
		return 'oneParameter';
	} else {
		// items of type objects expected
		logger.trace('Loop requested on collection of object! URL could have many parameters');
		return 'multipleParameters';
	}
}

// Relevant for URLs with multiple parameters
function constructUrlFromObject(url, obj, logger) {
	let location = url;
	const properties = getPametrizedProperties(url);
	if (properties.length === 0) {
		logger.trace('URL is not parametrized properly. Use curly braces around dynamic parts of it.');
	} else {
		properties.forEach((property) => {
			location = location.replace(`{${property}}`, obj[property]);
		});
	}
	return location;
}

function fillAPIKey(headers, apiKey) {
	if (!headers) {
		return;
	}

	if (!apiKey) {
		// preserve headers
		return headers;
	}

	for (const header in headers) {
		const value = headers[header];
		if (placeholderApiKeyRgx.exec(value)) {
			headers[header] = value.replace('{apiKey}', apiKey);
			return headers;
		}
	}
}

function constructUrlFromArray(url, values) {
	let location = url;
	const properties = getPametrizedProperties(url);
	if (properties.length === 0) {
		logger.trace('URL is not parametrized properly. Use curly braces around dynamic parts of it.');
	} else {
		properties.forEach((property, index) => {
			location = location.replace(`{${property}}`, values[index]);
		});
	}
	return location;
}

// Relevant for URLs with single parameter
function constructUrlFromString(url, paramValue) {
	let location = url;
	const properties = getPametrizedProperties(url);
	if (properties.length === 0) {
		logger.trace('URL is not parametrized properly. Use curly braces around dynamic parts of it.')
	} else {
		location = location.replace(`{${properties[0]}}`, paramValue);
	};

	return location;
}

function getPametrizedProperties(url) {
	const properties = [];
	let curMatch;
	while (curMatch = placeholderRgx.exec(url)) {
		properties.push(curMatch[1]);
	}
	return properties;
}

module.exports = {
	request, loop
};
