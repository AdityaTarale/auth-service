import fs from 'fs'
import createHttpError from 'http-errors'
import { JwtPayload, sign } from 'jsonwebtoken'
import path from 'path'
import { Config } from '../config'

export class TokenService {
    generateAccessToken(payload: JwtPayload): string {
        let privateKey: Buffer

        try {
            privateKey = fs.readFileSync(
                path.join(__dirname, '../../certs/private.pem'),
            )
        } catch {
            const err = createHttpError(500, 'Error while reading private key')
            throw err
        }

        const accessToken = sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
            issuer: Config.SERVICE_NAME,
        })

        return accessToken
    }

    generateRefreshToken(payload: JwtPayload, jwtid: string): string {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: Config.SERVICE_NAME,
            jwtid: jwtid,
        })

        return refreshToken
    }
}
