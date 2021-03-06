/**
 * Pinpoint Node.js Agent
 * Copyright 2020-present NAVER Corp.
 * Apache License v2.0
 */

const test = require('tape')
const axios = require('axios')
const request = require('supertest')

const { log, fixture, util, enableDataSending } = require('../../test-helper')

const agent = require('../../support/agent-singleton-mock')

const Koa = require('koa')
const Router = require('koa-router')
const Promise = require("bluebird");

const testName1 = 'koa-router1'
test(`${testName1} Should record request in basic route in bluebird.test.js`, async function (t) {
  agent.bindHttp()

  const testName = testName1

  t.plan(1)

  const PATH = `/${testName}`
  const app = new Koa()
  const router = new Router()

  router.get(PATH, async (ctx, next) => {
    ctx.body = 'ok. get'
  })
  router.post(PATH, async (ctx, next) => {
    ctx.body = 'ok. post'
  })

  app.use(router.routes()).use(router.allowedMethods())
  request(app.callback())
    .post(PATH)
    .expect(200)
    .end(() => {
      const traceMap = agent.traceContext.getAllTraceObject()
      t.ok(traceMap.size > 0)
    })
})