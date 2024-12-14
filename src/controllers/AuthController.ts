import { NextFunction, Response } from 'express'

import { validationResult } from 'express-validator'
import createHttpError from 'http-errors'
import { JwtPayload } from 'jsonwebtoken'
import { Logger } from 'winston'
import { CredentialService } from '../services/CredentialService'
import { TokenService } from '../services/TokenService'
import { UserService } from '../services/UserService'
import { AuthRequest, RegisterUserRequest } from '../types'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        // validation
        const result = validationResult(req)
        if (!result.isEmpty()) {
            res.status(400).json({ errors: result.array() })
            return
        }

        const { firstName, lastName, email, password } = req.body

        this.logger.debug('New request to register a user', {
            firstName,
            lastName,
            email,
            password: '******',
        })

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })
            this.logger.info('User has been registered', { id: user.id })

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            // Persist the refresh token in the database

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                String(newRefreshToken.id),
            )

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1H
                httpOnly: true, // very important
            })

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true, // very important
            })

            res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
            return
        }
    }

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        // validation
        const result = validationResult(req)
        if (!result.isEmpty()) {
            res.status(400).json({ errors: result.array() })
            return
        }

        const { email, password } = req.body

        this.logger.debug('New request to login a user', {
            email,
            password: '******',
        })

        try {
            const user = await this.userService.findByEmail(email)

            if (!user) {
                const err = createHttpError(
                    401,
                    'Email and password does not match',
                )
                next(err)
                return
            }

            const isPasswordMatch =
                await this.credentialService.comparePassword(
                    password,
                    user.password,
                )

            if (!isPasswordMatch) {
                const err = createHttpError(
                    401,
                    'Email and password does not match',
                )
                next(err)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            // Persist the refresh token in the database

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            const refreshToken = this.tokenService.generateRefreshToken(
                payload,
                String(newRefreshToken.id),
            )

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1H
                httpOnly: true, // very important
            })

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true, // very important
            })

            this.logger.info('User has been logged in', { id: user.id })
            res.json({ id: user.id })
        } catch (error) {
            next(error)
            return
        }
    }

    async self(req: AuthRequest, res: Response) {
        // token req.auth.sub
        const user = await this.userService.findById(req.auth.sub)

        res.json({ ...user, password: undefined })
    }
}
