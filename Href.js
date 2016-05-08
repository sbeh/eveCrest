'use strict'

var Href = (function () {
	function Href() { }
	/**
	 * This method wraps XMLHttpRequest and provides some useful debugging information in the browser's console.
	 * The http response's body needs to be empty or a valid JSON string, otherwise an error will be generated.
	 * The JSON string will be parsed into an object and given as an argument to 
	 * If the body is not empty and is not a which will be parsed and returned as a javascript object.
	 *
	 * @method request
	 * @param {Object} options
	 * @param {String} options.method If defined, will set the http method to use with this request. Otherwise "GET" will be used
	 * @param {Object} options.data If defined, data will be given to method XMLHttpRequest.send() to be send with this request
	 * @param {Function} options.setup If defined, function will be executed right before calling XMLHttpRequest.send()
	 * @param {Function} options.finish If defined, function will be executed when http request has been finished
	 */
	Href.prototype.request = function (options) {
		if (!options)
			options = {}
		if (!options.method)
			options.method = 'GET'

		if (typeof VERBOSE !== 'undefined' && VERBOSE)
			console.log('>> ' + options.method + ' ' + this.href + (options.data ? '\n   ' + JSON.stringify(options.data) : ''))

		var req = new XMLHttpRequest()

		//req.responseType = 'json'
		req.onreadystatechange = function () {
			if (this.readyState === XMLHttpRequest.DONE) {
				if (typeof VERBOSE !== 'undefined' && VERBOSE)
					console.log('<< ' + this.status + ' ' + this.response)

				if (options.finish)
					options.finish(JSON.parse(this.response))
			}
		}

		req.open(options.method, this.href)

		if (this.auth)
			this.auth.setup(req, send)
		else if (this.root_href && this.root_href.auth)
			this.root_href.auth.setup(req, send)
		else
			send()

		function send() {
			if (options.setup)
				options.setup(req)

			req.send(options.data)
		}
	}
	/**
	 * This method generates an http GET request and merges the JSON response into this instance of the current object
	 *
	 * @method get
	 * @param {Function} call If defined, function will be executed when http request has been finished
	 */
	Href.prototype.get = function (call) {
		this.request({
			method: 'GET',
			finish: function (res) {
				Object.keys(this).forEach(function (i) {
					switch (i) {
						case 'href':
						case 'root_href':
						case 'auth':
							break
						default:
							delete this[i]
					}
				}.bind(this))

				var rec = function (con) {
					Object.keys(con).forEach(function (i) {
						if (con[i] instanceof Object) {
							rec(con[i])

							if (con[i].href) {
								var co
								if (// this object belongs to the current branch of this crest model tree or
									con[i].href.indexOf(this.href) === 0 ||
									// this object is a reference to somewhere outside of this crest api
									con[i].href.indexOf(this.root_href.href) === -1)
									co = new Href()
								else {
									// this object belongs to another branch of this crest model tree
									// it is just referenced from here
									// example: a character can be found in a fleet or as author of a mail but its original location is in the list of characters
									co = this.root_href

									var path = con[i].href.substring(co.href.length).split('/')
									var p = path.pop()
									if (p)
										path.push(p)
									for (p in path) {
										if (!co[path[p]]) {
											co[path[p]] = new Href();
											co[path[p]].href = this.root_href.href + path.slice(0, p).join('/') + '/'
											co[path[p]].root_href = this.root_href
										}
										co = co[path[p]]
									}
								}

								co.root_href = this.root_href

								Object.assign(co, con[i])

								con[i] = co
							}
						}
					}.bind(this))
				}.bind(this)
				rec(res)

				Object.assign(this, res)

				if (call)
					call()
			}.bind(this)
		})
	}
	/**
	 * This method generates an http POST request as if send from an html form.
	 *
	 * @method submit
	 * @param {Object} data Will be transformed into a string "property1=value1&property2=value2&prop..." and send as payload with the http request
	 * @param {Function} call If defined, function will be executed when http request has been finished
	 */
	Href.prototype.submit = function (data, call) {
		this.request({
			method: 'POST',
			setup: function (req) {
				req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
			},
			data: Object.keys(data).map(function (i) {
				return encodeURIComponent(i) + '=' + encodeURIComponent(data[i])
			}).join('&'),
			finish: call
		})
	}
	/**
	 * This method generates an http POST request and serializes any given data into a JSON string to transfer it with the request
	 *
	 * @method post
	 * @param {Object} data Will be serialized into a JSON string
	 * @param {Function} call If defined, function will be executed when http request has been finished
	 */
	Href.prototype.post = function (data, call) {
		this.request({
			method: 'POST',
			data: JSON.stringify(data),
			finish: call
		})
	}
	/**
	 * This method generates an http PUT request and serializes any given data into a JSON string to transfer it with the request
	 *
	 * @method put
	 * @param {Object} data Will be serialized into a JSON string
	 * @param {Function} call If defined, function will be executed when http request has been finished
	 */
	Href.prototype.put = function (data, call) {
		this.request({
			method: 'PUT',
			data: JSON.stringify(data),
			finish: call
		})
	}
	/**
	 * This method generates an http DELETE request
	 *
	 * @method delete
	 * @param {Function} call If defined, function will be executed when http request has been finished
	 */
	Href.prototype.delete = function (call) {
		this.request({
			method: 'DELETE',
			finish: call
		})
	}
	return Href
})()