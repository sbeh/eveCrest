'use strict'

var APP = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
var SECRET = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
var VERBOSE = false


(function startup() {
	// Parse any parameters from current URL
	var params = {};
	var p = location.search.substring(1).split(/[&=]/);
	for (var i = 0; i < p.length; i += 2)
		params[decodeURIComponent(p[i])] = decodeURIComponent(p[i + 1]);

	// Don't do any initialization with parameter ?stepbystep set
	if (params.stepbystep)
		return

	Href.forEveCrest(
		'https://crest-tq.eveonline.com/',
		SECRET,
		localStorage,
		forEveCrestResult
	)

	function forEveCrestResult(href, error) {
		if(!error)
			window.eveApi = href
		else if(error instanceof AuthError) {
			if (localStorage.state && localStorage.state === params.state) {
				delete localStorage.state

				href.auth.useAuthorizationCode(params.code, function () {
					location = location.origin + location.pathname
				})
			} else {
				localStorage.state = Math.random()

				window.location = 'https://login.eveonline.com/oauth/authorize/?' +
					'response_type=code&' +
					'redirect_uri=' + encodeURIComponent(window.location.href) + '&' +
					'client_id=' + APP + '&' +
					'scope=characterLocationRead+fleetRead+fleetWrite&' +
					'state=' + localStorage.state
			}
		} else
			throw error
	}
})()