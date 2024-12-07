import { NextFunction, Response } from 'express'

import { validationResult } from 'express-validator'
import fs from 'fs'
import createHttpError from 'http-errors'
import { JwtPayload, sign } from 'jsonwebtoken'
import path from 'path'
import { Logger } from 'winston'
import { Config } from '../config'
import { UserService } from '../services/UserService'
import { RegisterUserRequest } from '../types'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
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

            let privateKey: Buffer

            try {
                privateKey = fs.readFileSync(
                    path.join(__dirname, '../../certs/private.pem'),
                )
            } catch {
                const err = createHttpError(
                    500,
                    'Error while reading private key',
                )
                next(err)
                return
            }
            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = sign(payload, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h',
                issuer: Config.SERVICE_NAME,
            })

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: Config.SERVICE_NAME,
            })

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
}
