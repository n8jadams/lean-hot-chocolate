import { Button, Typography } from '@material-ui/core';
import React from 'react'
import { Props } from './machine-types-consts';
import { send } from './utils'

export function Lobby({ context }: Props): React.ReactElement<Props> {
	return (
		<>
			<Typography component="p">{context.users.length} {context.users.length === 1 ? 'user' : 'users'} ready</Typography>
			<Button variant="contained" color="primary" onClick={() => {
				send({ type: 'START_MEETING' })
			}}>
				Start Meeting
			</Button>
		</>
	)
}