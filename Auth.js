'use strict'

function AuthError() { }
if (typeof module !== 'undefined') module.exports.AuthError = AuthError

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
		if (this.store && this.loc && !this.token) {
			var stored = this.store['auth ' + this.loc.href]
			if (stored)
				Object.assign(this, JSON.parse(stored))
		}

		if (this.token && (!this.expire || this.expire > new Date())) {
			// current access token is valid
			if (req && req.setRequestHeader)
				req.setRequestHeader('Authorization', this.type + ' ' + this.token)

			if (call)
				call()
		} else if (this.request_auth && this.refresh_token) {
			// no access token available or current access token expired
			// request an access token before the actual request

			this.useRefreshToken(function (res) {
				if (req && req.setRequestHeader)
					req.setRequestHeader('Authorization', this.type + ' ' + this.token)

				if (call)
					call()
			}.bind(this))
		} else
			throw new AuthError('Failed to request first or fresh access_code from ' + this.request_auth.href)
	}
	Auth.prototype.receivedToken = function(res, call) {
		if (!res.token_type || !res.access_token)
			throw new AuthError('Failed to request first or fresh access_code from ' + this.request_auth.href)

		this.type = res.token_type
		this.token = res.access_token
		if (res.expires_in)
			this.expire = new Date(new Date().getTime() + (res.expires_in - 60) * 1000)

		this.refresh_token = res.refresh_token

		if (this.store)
			this.store['auth ' + this.loc.href] = JSON.stringify({
				type: this.type,
				token: this.token,
				expire: this.expire,
				refresh_token: this.refresh_token
			})

		if (call)
			call()
	}
	Auth.prototype.useAuthorizationCode = function (code, call) {
		// setup new SSO authorization, requesting first access_code
		this.request_auth.submit({
			grant_type: 'authorization_code',
			code: code
		}, function (res) {
			this.receivedToken(res, call)
		}.bind(this))
	}
	Auth.prototype.useRefreshToken = function (call) {
		// SSO authorization known, requesting fresh access_code
		this.request_auth.submit({
			grant_type: 'refresh_token',
			refresh_token: this.refresh_token
		}, function (res) {
			this.receivedToken(res, call)
		}.bind(this))
	}
	return Auth
})()

if (typeof module !== 'undefined') module.exports.Auth = Auth