require('dotenv').config()

const {join} = require('path')
const express = require('express')
const httpProxy = require('http-proxy')
const morgan = require('morgan')

const app = express()
const proxy = httpProxy.createProxyServer()

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(express.static('static'))

app.use('/api', (req, res) => {
  proxy.web(req, res, {
    target: process.env.API_URL || 'https://app.dvf.etalab.gouv.fr/api',
    changeOrigin: true
  })
})

function serveIndex(req, res) {
  res.sendFile(join(__dirname, 'static', 'index.html'))
}

app.get('/d/:codeDepartement', serveIndex)
app.get('/c/:codeCommune', serveIndex)
app.get('/c/:codeCommune/s/:idSection', serveIndex)
app.get('/c/:codeCommune/s/:idSection/p/:codeParcelle', serveIndex)
app.get('/', serveIndex)

app.listen(process.env.PORT || 3000)
