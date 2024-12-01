import { App } from 'supertest/types'
import app from '../../src/app'
import request from 'supertest'

describe('POST /auth/register', () => {
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
    })
    describe('Fields are missing', () => {})
})
