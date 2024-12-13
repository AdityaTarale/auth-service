import express, { NextFunction, Request, Response } from 'express'
import { AppDataSource } from '../config/data-source'
import logger from '../config/logger'
import { AuthController } from '../controllers/AuthController'
import { User } from '../entity/User'
import { TokenService } from '../services/TokenService'
import { UserService } from '../services/UserService'
import registerValidator from '../validators/registerValidator'
import loginValidator from '../validators/loginValidator'

import { RefreshToken } from '../entity/RefreshToken'
import { CredentialService } from '../services/CredentialService'
import authenticate from '../middlewares/authenticate'
import { AuthRequest } from '../types'

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken)

const userService = new UserService(userRepository)
const tokenService = new TokenService(refreshTokenRepository)
const credentialService = new CredentialService()
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
)

router.post(
    '/register',
    registerValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
)

router.post(
    '/login',
    loginValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next),
)

router.get('/self', authenticate, (req: Request, res: Response) =>
    authController.self(req as AuthRequest, res),
)

export default router
