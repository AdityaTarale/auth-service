import app from './app'
import { Config } from './config'
import logger from './config/logger'

const startServer = () => {
    const PORT = Config.PORT
    try {
        app.listen(PORT, () => {
            logger.error('testing error log')
            logger.info(`Server listening on port`, {
                port: PORT,
            })
        })
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

startServer()
