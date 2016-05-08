'use strict'

var Fleet = (function () {
	OO.inherits(Fleet, Href)
	function Fleet(href) {
		this.href = href
		this.root_href = eveApi
	}
	return Fleet
})()
if (typeof module !== 'undefined') module.exports.Fleet = Fleet