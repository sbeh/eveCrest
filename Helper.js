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

	// Setup root container for any CREST activity
	var h = new Href()
	//   Set root container as a reference to itself
	h.root_href = h
	//   Setup CREST entry point URL
	h.href = 'https://crest-tq.eveonline.com/'
	//    Start first test request
	h.get(function () {
		// Check if request finished successfully
		// https://crest-tq.eveonline.com/authEndpoint/ will link to EVE Single sign-on service and is expected to be always there
		if (!h.authEndpoint) {
			alert('EVE CREST API: Failed to GET ' + h.href)

			return
		}

		// Setup access_token authentication for the CREST URL
		h.auth = new Auth()
		h.auth.loc = h
		h.auth.store = localStorage
		// Setup refresh_token authentication for the EVE Single sign-on
		h.auth.request_auth = new Href()
		h.auth.request_auth.href = h.authEndpoint.href
		h.auth.request_auth.auth = new Auth()
		h.auth.request_auth.auth.loc = h.auth.request_auth
		h.auth.request_auth.auth.type = 'Basic'
		h.auth.request_auth.auth.token = SECRET

		try {
			h.auth.setup(null, function () {
				window.eveApi = h

				if (VERBOSE)
					console.log('EVE CREST API: Ready')
			})
		} catch (e) {
			if (!(e instanceof AuthError))
				throw e

			if (localStorage.state && localStorage.state === params.state) {
				delete localStorage.state

				h.auth.authorization_code = params.code
				h.auth.setup(null, function () {
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
		}
	})
})()