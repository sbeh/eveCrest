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
	var href = new Href()
	//   Set root container as a reference to itself
	href.root_href = href
	//   Setup CREST entry point URL
	href.href = 'https://crest-tq.eveonline.com/'
	//    Start first test request
	href.get(function () {
		// Check if request finished successfully
		// https://crest-tq.eveonline.com/authEndpoint/ will link to EVE Single sign-on service and is expected to be always there
		if (!href.authEndpoint) {
			alert('EVE CREST API: Unable to find authentication entry point at ' + href.href)

			return
		}

		// Setup authentication for the CREST
		// access_token is used with this endpoint
		href.auth = new Auth()
		href.auth.loc = href
		href.auth.store = localStorage
		// Setup endpoint to EVE Single sign-on
		// authorization_code or refresh_token is given to this endpoint
		// In return a new access_token for CREST is provided
		href.auth.request_auth = new Href()
		href.auth.request_auth.href = href.authEndpoint.href
		// Setup authentication for EVE Single sign-on
		// basic username and password is used to authenticate with this endpoint
		href.auth.request_auth.auth = new Auth()
		href.auth.request_auth.auth.loc = href.auth.request_auth
		// 3rd party applications are registered on https://developers.eveonline.com/
		// user and password belong to this application
		href.auth.request_auth.auth.type = 'Basic'
		href.auth.request_auth.auth.token = SECRET

		try {
			href.auth.setup(null, function () {
				window.eveApi = href

				if (VERBOSE)
					console.log('EVE CREST API: Ready')
			})
		} catch (e) {
			if (!(e instanceof AuthError))
				throw e

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
		}
	})
})()