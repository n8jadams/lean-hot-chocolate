import { LeanHotChocolateMachineEvent } from './machine-types-consts'

export function send(event: LeanHotChocolateMachineEvent) {
	return fetch('/event', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({event})
	}).then((res) => res.json())
}