import React from 'react'
import { EndMeetingButton } from './EndMeetingButton';
import { Props } from './machine-types-consts';

export function ContinueVoting({ context }: Props): React.ReactElement<Props> {
	return <>
		<EndMeetingButton />
	</>
}