'use strict'

var APP = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
var SECRET = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
var VERBOSE = false

function objToObjCopy(s, t) {
    Object.keys(s).forEach(function (k) {
        t[k] = s[k]
    })
}

(function startup() {
    var params = {};
    var p = location.search.substring(1).split(/[&=]/);
    for (var i = 0; i < p.length; i += 2)
        params[decodeURIComponent(p[i])] = decodeURIComponent(p[i + 1]);

    if (params.stepbystep)
        return

    var h = new Href()
    h.href = 'https://crest-tq.eveonline.com/'
    h.get(function () {
        if (!h.authEndpoint) {
            alert('EVE CREST API: Failed to GET ' + h.href)

            return
        }

        h.auth = new Auth()
        h.auth.loc = h
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
                var state = Math.random()
                localStorage.state = state

                window.location = 'https://login.eveonline.com/oauth/authorize/?' +
                    'response_type=code&' +
                    'redirect_uri=' + encodeURIComponent(window.location.href) + '&' +
                    'client_id=' + APP + '&' +
                    'scope=characterLocationRead+fleetRead+fleetWrite&' +
                    'state=' + state
            }
        }
    })
})()