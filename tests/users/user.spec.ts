import request from 'supertest'
import { App } from 'supertest/types'
import { DataSource } from 'typeorm'
import app from '../../src/app'
import { AppDataSource } from '../../src/config/data-source'
import createJWKSMock from 'mock-jwks'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
describe('GET /auth/self', () => {
    let connection: DataSource
    // json web key set
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            })

            const response = await request(app as unknown as App)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it('should return the user data', async () => {
            // register a user
            const userData = {
                firstName: 'Aditya',
                lastName: 'Tarale',
                email: 'tarale.adi@gmail.com',
                password: 'password123',
            }

            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            // generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            // add token to cookie
            const response = await request(app as unknown as App)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send()

            // asserts
            // check if user id matches with registered user
            expect((response.body as Record<string, string>).id).toBe(data.id)
        })

        it('should not return the password field', async () => {
            // register a user
            const userData = {
                firstName: 'Aditya',
                lastName: 'Tarale',
                email: 'tarale.adi@gmail.com',
                password: 'password123',
            }

            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            // generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            // add token to cookie
            const response = await request(app as unknown as App)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send()

            // asserts
            // check if user id matches with registered user
            expect(response.body as Record<string, string>).not.toHaveProperty(
                'password',
            )
        })
    })
})
