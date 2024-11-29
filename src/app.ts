import express, { NextFunction, Request, Response } from 'express'
import { HttpError } from 'http-errors'
import logger from './config/logger'

const app = express()

app.get('/', (req, res) => {
    res.send('Hello, World!')
})

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || 500

    res.status(statusCode).send({
        errors: [
            {
                type: err.name,
                message: err.message,
                path: '',
                location: '',
            },
        ],
    })
})

export default app
