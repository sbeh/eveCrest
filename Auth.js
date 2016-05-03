'use strict'

function AuthError() { }

var Auth = (function () {
    function Auth() { }
    /**
     * Sets up the authorization http header
     * Tries to request a new authorization secret if the current expired
     *
     * @method setup
     * @param {XMLHttpRequest} req
     * @param {Function} call Will be executed when http header has been set
     * @throws {AuthError} Will be thrown if no valid authorization secret was available
     */
    Auth.prototype.setup = function (req, call) {
        if (this.loc && !this.token) {
            var stored = localStorage['auth ' + this.loc.href]
            if (stored)
                Object.assign(this, JSON.parse(stored))
        }

        if (this.token && (!this.expire || this.expire > new Date())) {
            // current access token is valid
            if (req && req.setRequestHeader)
                req.setRequestHeader('Authorization', this.type + ' ' + this.token)

            if (call)
                call()
        } else if (this.request_auth && (this.authorization_code || this.refresh_token)) {
            // no access token available or current access token expired
            // request an access token before the actual request
            var data
            if (this.authorization_code) {
                // setup new SSO authorization, requesting first access_code
                data = {
                    grant_type: 'authorization_code',
                    code: this.authorization_code
                }
                // authorization codes are one-time codes
                delete this.authorization_code
            } else
                // SSO authorization known, requesting fresh access_code
                data = {
                    grant_type: 'refresh_token',
                    refresh_token: this.refresh_token
                }

            this.request_auth.submit(data, function (res) {
                if (!res.token_type || !res.access_token)
                    throw new AuthError('Failed to request first or fresh access_code from ' + this.request_auth.href)

                this.type = res.token_type
                this.token = res.access_token
                if (res.expires_in)
                    this.expire = new Date(new Date().getTime() + (res.expires_in - 60) * 1000)

                this.refresh_token = res.refresh_token

                localStorage['auth ' + this.loc.href] = JSON.stringify({
                    type: this.type,
                    token: this.token,
                    expire: this.expire,
                    refresh_token: this.refresh_token
                })

                if (req && req.setRequestHeader)
                    req.setRequestHeader('Authorization', this.type + ' ' + this.token)

                if (call)
                    call()
            }.bind(this))
        } else
            throw new AuthError('Failed to request first or fresh access_code from ' + this.request_auth.href)
    }
    return Auth
})()