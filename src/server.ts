import app from './app'
import { Config } from './config'
import { AppDataSource } from './config/data-source'
import logger from './config/logger'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connected successfully')

        app.listen(PORT, () =>
            logger.info('Server listening on port', { port: PORT }),
        )
    } catch (error) {
        console.log(error)
    }
}

void startServer()
