import { Button, TextField, Typography } from '@material-ui/core';
import React from 'react'
import { Props } from './machine-types-consts';
import { send } from './send'

export function Lobby({
	context,
	currentUserId,
	setCurrentUserId
}: Props): React.ReactElement<Props> {
	const [username, setUsername] = React.useState('')
	const [error, setError] = React.useState(false)

	return <>
		{!currentUserId ? (
			<form noValidate autoComplete="off" onSubmit={(e) => {
				e.preventDefault()

				if (!username) {
					setError(true)
					return
				}
				; (async () => {
					const { userId } = await send({ type: 'USER_JOINED', username })
					if(setCurrentUserId) {
						setCurrentUserId(userId)
					}
				})()
			}}>
				<TextField
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
		): (
			<>
				<Typography component="p">{context.users.length} users ready</Typography>
				<Button variant="contained" color="primary" onClick={() => {
					send({ type: 'START_MEETING' })
				}}>
					Start Meeting
				</Button>
			</>
		)}
	</>
}