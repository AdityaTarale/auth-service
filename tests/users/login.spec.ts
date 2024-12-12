import request from 'supertest'
import { App } from 'supertest/types'
import { DataSource } from 'typeorm'
import app from '../../src/app'
import { AppDataSource } from '../../src/config/data-source'
import { isJwt } from '../utils'

describe('POST /auth/login', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()

        // Call the register service to create a user
        const registerData = {
            firstName: 'Aditya',
            lastName: 'Tarale',
            email: 'tarale.adi@gmail.com',
            password: 'password123',
        }

        await request(app as unknown as App)
            .post('/auth/register')
            .send(registerData)
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the 200 status code', async () => {
            // AAA
            // Arrange
            const userData = {
                email: 'tarale.adi@gmail.com',
                password: 'password123',
            }
            // Act
            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(200)
        })

        it('should return valid JSON response', async () => {
            const userData = {
                email: 'tarale.adi@gmail.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            expect(response.headers['content-type']).toEqual(
                expect.stringContaining('json'),
            )
        })

        it('should return access and refresh tokens in cookies', async () => {
            const userData = {
                email: 'tarale.adi@gmail.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            interface Headers {
                ['set-cookie']: string[]
            }

            let accessToken = null
            let refreshToken = null

            const cookies =
                (response.headers as unknown as Headers)['set-cookie'] || []
            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }
                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })
    })

    describe('Given invalid credentials', () => {
        it('should return 401 status code for non-existent email', async () => {
            const userData = {
                email: 'non-existent@example.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            expect(response.statusCode).toBe(401)
        })

        it('should return 401 status code for incorrect password', async () => {
            const userData = {
                email: 'tarale.adi@gmail.com',
                password: 'wrong-password',
            }

            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            expect(response.statusCode).toBe(401)
        })
    })

    describe('Given missing fields', () => {
        it('should return 400 status code if email is missing', async () => {
            const userData = {
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if password is missing', async () => {
            const userData = {
                email: 'tarale.adi@gmail.com',
            }

            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })
    })

    describe('Given malformed input', () => {
        it('should return 400 status code if email is not a valid format', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/login')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })
    })
})
