import React from 'react'
import { Props } from './machine-types-consts';
import { Button, Card, CardContent, Typography } from "@material-ui/core";
import { getUserById } from './utils';
import { EndMeetingButton } from './EndMeetingButton';
import { send } from './utils'

export function Discussion({ context }: Props): React.ReactElement<Props> {
	const winningTopicId = context.topicVoteResults[0]
	const topic = context.topics.find(topic => topic.id === winningTopicId)
	
	// We need to do this because the discussion.entry state
	// doesn't happen immediately, fortunately it's not noticeable
	// to the end user
	if (!topic) {
		return <></>
	}

	function displayTimeLeft(timeLeftInSeconds: number): string {
		return new Date(timeLeftInSeconds * 1000).toISOString().substr(15, 4)
	}

	return (
		<>
			<Typography component="h2">Discuss:</Typography>
			<Card key={topic.id} variant="outlined">
				<CardContent>
					<Typography>Number of votes: {topic.votesCastFor.length}</Typography>
					<Typography variant="h5" component="h2">
						{topic.name}
					</Typography>
					<Typography color="textSecondary">
						Submitted by:{" "}
						{getUserById(topic.createdByUser.id, context.users)?.username ??
							""}
					</Typography>
				</CardContent>
			</Card>
			<Typography color="error">Time left for discussion: {displayTimeLeft(context.timer)}</Typography>
			<Button
				variant="contained" color="primary" onClick={() => {
					send({ type: 'SKIP_TO_NEXT_TOPIC' })
				}}>
				Skip to next topic
			</Button>
			<EndMeetingButton />
		</>
	)
}