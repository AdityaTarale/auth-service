import { config } from 'dotenv'
config()

const { SERVICE_NAME, PORT, NODE_ENV } = process.env

export const Config = {
    SERVICE_NAME,
    PORT,
    NODE_ENV,
}
