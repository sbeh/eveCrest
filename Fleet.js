'use strict'

var Fleet = (function () {
    OO.inherits(Fleet, Href)
    function Fleet(href) {
        this.href = href
        this.root_href = window.eveApi
    }
    return Fleet
})()