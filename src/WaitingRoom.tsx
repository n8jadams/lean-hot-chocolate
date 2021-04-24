import React from 'react'
import { Button, TextField } from '@material-ui/core';
import { send } from './utils'

interface WaitingRoomProps {
	setCurrentUserId: (userId: string) => void;
}

export function WaitingRoom({
	setCurrentUserId,
}: WaitingRoomProps): React.ReactElement<WaitingRoomProps> {
	const [username, setUsername] = React.useState('')
	const [error, setError] = React.useState(false)

	return (
		<form noValidate autoComplete="off" onSubmit={(e) => {
			e.preventDefault()

			if (!username) {
				setError(true)
				return
			}
			; (async () => {
				const { userId } = await send({ type: 'USER_JOINED', username })
				setCurrentUserId(userId)
			})()
		}}>
			<TextField
				autoFocus
				label="username"
				variant="outlined"
				value={username}
				error={error}
				helperText={error ? 'Username cannot be empty pal' : undefined}
				onChange={(e) => {
					setError(false)
					setUsername(e.target.value)
				}}
			/>
			<Button variant="contained" color="primary" type="submit">
				Set Username
			</Button>
		</form>
	)
}