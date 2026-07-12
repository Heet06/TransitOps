const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
)

app.get('/', (_request, response) => {
  response.json({
    name: 'TransitOps API',
    status: 'ok',
  })
})

app.get('/health', (_request, response) => {
  response.json({ status: 'healthy' })
})

app.use((request, response) => {
  response.status(404).json({
    error: 'Not found',
    path: request.originalUrl,
  })
})

app.listen(port, () => {
  console.log(`TransitOps backend listening on port ${port}`)
})