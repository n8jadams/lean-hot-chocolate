import { User } from "./machine-types-consts";

export function getUserById(id: string, users: User[]): User | undefined{
    return users.find(user => user.id === id)
}