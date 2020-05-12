'use strict'

const { fixture, util, log } = require('../test-helper')

const dataSender = () => {
    return {
        sendApiMetaInfo: function(apiMetaInfo) {
          this.mockAPIMetaInfo = apiMetaInfo
        },
        sendSpan: function(span) {
          this.mockSpan = span
        },
        sendSpanChunk: function(spanChunk) {
          this.mockSpanChunk = spanChunk
        },
        sendStringMetaInfo: function(metaInfo) {
          this.mockMetaInfo = metaInfo
        }
    }
}

module.exports = dataSender