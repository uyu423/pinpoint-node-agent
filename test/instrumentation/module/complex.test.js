const test = require('tape')
const axios = require('axios')

const { log, fixture, util, enableDataSending } = require('../../test-helper')
enableDataSending()

const Agent = require('../../../lib/agent')
const agent = new Agent(fixture.config)

const ioRedis = require('ioredis')
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const bookSchema = new Schema({
  title: String,
  author: String,
  published_date: { type: Date, default: Date.now }
})
const mongoData = {
  title: 'NODE.js by Pinpoint',
  author: 'iforget',
  published_date: new Date()
}
const Book = mongoose.model('book', bookSchema)

const db = mongoose.connection
db.on('error', console.error)
db.once('open', function () {
  console.log("Connected to mongod server")
})
mongoose.connect('mongodb://***REMOVED***/mongodb_pinpoint')

const express = require('express')
const Koa = require('koa')
const Router = require('koa-router')
const koaBodyParser = require('koa-bodyparser')

const TEST_ENV = {
  host: 'localhost',
  port: 5005,
}
const getServerUrl = (path) => `http://${TEST_ENV.host}:${TEST_ENV.port}${path}`


const testName1 = 'koa-complex'
test(`${testName1} should Record the connections between koa and mongodb and redis.`, function (t) {
  const testName = testName1

  t.plan(1)
  const app = new Koa()
  const router = new Router()
  const PATH = `/${testName}/api/books`
  const redis = new ioRedis(6379,'***REMOVED***')

  router.get(`${PATH}/:author`, async (ctx, next) => {
    const key = ctx.params.author

    await Promise.all([
      Book.findOne({author: key}).exec(),
      redis.get(key)
    ])

    ctx.body = 'good'
  })

  app.use(router.routes()).use(router.allowedMethods())

  const server = app.listen(TEST_ENV.port, async () => {
    await mongoose.connect('mongodb://***REMOVED***/mongodb_pinpoint')

    console.log('Test1. Find and Cache')
    const rstFind = await axios.get(`${getServerUrl(PATH)}/iforget`)
    t.ok(rstFind.status, 200)

    server.close()
  })
})

const testName2 = 'express-complex'
test(`${testName2} should Record the connections between express and redis.`, function (t) {
  const testName = testName2

  t.plan(2)

  const app = new express()
  const redis = new ioRedis(6379, '***REMOVED***')
  const PATH = `/${testName}`

  app.use(express.json())
  app.use(function(req,res,next){
    req.cache = redis
    next()
  })
  app.get(`${PATH}/:name`, function(req, res, next){
    var key = req.params.name
    Book.findOne({ author: key }, function(err, book) {
      if (err) return res.status(500).json({ error: err })
      if (!book) return res.status(404).json({ error: 'book not found' })

      console.log('test2?')
      res.send(book)
    })
    console.log('Test!?')
  })
  app.post(PATH, function(req, res){
    const { title, author, published_date } = req.body
    const book = new Book({
      title,
      author,
      published_date
    })
    book.save(function(err){
      if(err){
        console.error(err)
        res.json({result: 0})
        return
      }
      res.json({result: 1})
    })
  })

  app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
  })

  const server = app.listen(TEST_ENV.port, async function () {
    console.log('Test1. Find and Cache')
    const rstGet = await axios.get(getServerUrl(`${PATH}/iforget`))
    t.ok(rstGet.status, 200)

    const traceMap = agent.traceContext.getAllTraceObject()
    log.debug(traceMap.size)
    t.ok(traceMap.size > 0)

    server.close()
  })
})


test.onFinish(() => {
  agent.pinpointClient.dataSender.closeClient()
})