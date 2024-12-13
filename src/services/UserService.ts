import bcrypt from 'bcrypt'
import createHttpError from 'http-errors'
import { Repository } from 'typeorm'
import { Roles } from '../constants'
import { User } from '../entity/User'
import { UserData } from '../types'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstName, lastName, email, password }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })
        if (user) {
            const err = createHttpError(400, 'Email is already exists!')
            throw err
        }

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

    async findByEmail(email: string) {
        const user = await this.userRepository.findOne({ where: { email } })

        return user
    }

    async findById(id: number) {
        const user = await this.userRepository.findOne({ where: { id } })

        return user
    }
}
