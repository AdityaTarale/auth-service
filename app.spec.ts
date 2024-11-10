import app from './src/app'
import { calculateDiscount } from './src/utils'
import request from 'supertest'

describe('App', () => {
    it('should return correct discount amount', () => {
        const discount = calculateDiscount(100, 10)
        expect(discount).toBe(90)
    })

    it('should return 200 status code', async () => {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const res = await request(app).get('/').send()
        expect(res.statusCode).toBe(200)
    })
})
