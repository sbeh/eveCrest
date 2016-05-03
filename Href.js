'use strict'

var Href = (function () {
    function Href() { }
    Href.prototype.request = function (options) {
        if (!options.method)
            options.method = 'GET'

        if (VERBOSE)
            console.log('>> ' + options.method + ' ' + this.href + (options.data ? '\n   ' + JSON.stringify(options.data) : ''))

        var req = new XMLHttpRequest()

        //req.responseType = 'json'
        req.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (VERBOSE)
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
                                var co = new Href()

                                co.root_href = this.root_href || this

                                objToObjCopy(con[i], co)

                                con[i] = co
                            }
                        }
                    }.bind(this))
                }.bind(this)
                rec(res)

                objToObjCopy(res, this)

                if (call)
                    call()
            }.bind(this)
        })
    }
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
    Href.prototype.post = function (data, call) {
        this.request({
            method: 'POST',
            data: JSON.stringify(data),
            finish: call
        })
    }
    Href.prototype.put = function (data, call) {
        this.request({
            method: 'PUT',
            data: JSON.stringify(data),
            finish: call
        })
    }
    Href.prototype.delete = function (call) {
        this.request({
            method: 'DELETE',
            finish: call
        })
    }
    return Href
})()