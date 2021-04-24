import { User, LeanHotChocolateMachineEvent } from './machine-types-consts'

export function send(event: LeanHotChocolateMachineEvent) {
  return fetch('/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event }),
  }).then((res) => res.json())
}

export function getUserById(id: string, users: User[]): User | undefined {
  return users.find((user) => user.id === id)
}
