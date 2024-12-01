import { config } from 'dotenv'
import path from 'path'
config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`) })

const {
    SERVICE_NAME,
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
} = process.env

export const Config = {
    SERVICE_NAME,
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
}
