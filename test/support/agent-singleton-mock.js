'use strict'

const { fixture, util, log } = require('../test-helper')
const instManager = require('../../lib/instrumentation/inst-manager')

const enableDataSending = require('../test-helper').enableDataSending
enableDataSending()
const Agent = require('../../lib/agent')
const dataSenderMock = require('./data-sender-mock')
const shimmer = require('shimmer')
const httpShared = require('../../lib/instrumentation/http-shared')

class MockAgent extends Agent {
    createAgentInfo(config, agentStartTime) {
        this.mockAgentInfo = super.createAgentInfo(config, agentStartTime)
        return this.mockAgentInfo
    }

    startSchedule(agentId, agentStartTime) {
        this.mockAgentId = agentId
        this.mockAgentStartTime = agentStartTime
    }

    initializeDataSender() {
        this.dataSender = dataSenderMock()
        this.dataSender.send(this.agentInfo)
    }

    bindHttp() {
        this.cleanHttp()

        const http = require('http')
        log.debug('shimming http.Server.prototype.emit function')
        shimmer.wrap(http && http.Server && http.Server.prototype, 'emit', httpShared.instrumentRequest(agent, 'http'))
      
        log.debug('shimming http.request function')
        shimmer.wrap(http, 'request', httpShared.traceOutgoingRequest(agent, 'http'))

        const traces = this.traceContext.getAllTraceObject()
        traces.forEach((trace) => {
            this.traceContext.completeTraceObject(trace)
        })
    }

    cleanHttp() {        
        const http = require('http')
        shimmer.unwrap(http && http.Server && http.Server.prototype, 'emit')
        shimmer.unwrap(http, 'request')

        const traces = this.traceContext.getAllTraceObject()
        traces.forEach((trace) => {
            this.traceContext.completeTraceObject(trace)
        })

    }

    cleanup() {
    }

    resetAgent(callback) {
        this.pinpointClient = new MockPinpointClient(this.config, this.mockAgentInfo)
    }
}

const agent = new MockAgent(fixture.config)
module.exports = agent