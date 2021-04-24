import React from 'react'
import { Button } from "@material-ui/core";
import { send } from './utils';

export function EndMeetingButton(): React.ReactElement {
	return (
		<Button
			variant="contained" color="secondary"
			onClick={() => {
				send({ type: 'END_MEETING' })
			}}
		>
			End Meeting
		</Button>
	)
}