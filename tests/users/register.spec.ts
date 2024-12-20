import request from 'supertest'
import { App } from 'supertest/types'
import { DataSource } from 'typeorm'
import app from '../../src/app'
import { AppDataSource } from '../../src/config/data-source'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'

describe('POST /auth/register', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the 201 status code', async () => {
            // AAA
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }
            // Act
            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.statusCode).toBe(201)
        })

        it('should return valid JSON response', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            expect(response.headers['content-type']).toEqual(
                expect.stringContaining('json'),
            )
        })

        it('should persist the user in the database', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })

        it('should return and id of the created user', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(1)
            expect(users[0]).toHaveProperty('id')
        })

        it('should assign a customer role', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('should store the hashed password in the database', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('should return a 400 status code of email is already exists', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })

        it('should return the access token and refresh token inside a cookie', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
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

        it('should store the refresh token in the database', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const refreshTokenRepo = connection.getRepository(RefreshToken)
            // const refreshTokens = await refreshTokenRepo.find()
            // expect(refreshTokens).toHaveLength(1)

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId= :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })
    describe('Fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if firstName is missing', async () => {
            const userData = {
                firstName: '',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
        it('should return 400 status code if lastName is missing', async () => {
            const userData = {
                firstName: 'John',
                lastName: '',
                email: 'johndoe@example.com',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: '',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
    })

    describe('Fields are not in proper format', () => {
        it('should trim the email field', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: '   johndoe@example.com  ',
                password: 'password123',
            }

            await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users[0].email).toBe('johndoe@example.com')
        })

        it('should return 400 status code if email is not a valid email', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if password length is less than 8 chars', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@example.com',
                password: '123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('should return an array of error messages if email is missing', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                password: 'password123',
            }

            const response = await request(app as unknown as App)
                .post('/auth/register')
                .send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
            expect(response.body).toHaveProperty('errors')
            expect(response.body).toEqual({
                errors: [
                    {
                        location: 'body',
                        msg: 'Email is required!',
                        path: 'email',
                        type: 'field',
                        value: '',
                    },
                    {
                        location: 'body',
                        msg: 'Please provide a valid email address',
                        path: 'email',
                        type: 'field',
                        value: '',
                    },
                ],
            })
        })
    })
})
