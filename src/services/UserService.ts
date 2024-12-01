import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { UserData } from '../types'
import createHttpError from 'http-errors'
import { Roles } from '../constants'
import bcrypt from 'bcrypt'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstName, lastName, email, password }: UserData) {
        const saltRounds = 10
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })
        } catch {
            const err = createHttpError(
                500,
                'Failed to store the data in the database',
            )
            throw err
        }
    }
}