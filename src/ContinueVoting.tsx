import React from 'react'
import { EndMeetingButton } from './EndMeetingButton';
import { ContinueVote, Props } from './machine-types-consts';
import { Button, Card, CardContent, Typography } from "@material-ui/core";
import { getUserById } from './utils';
import { send } from './utils';

export function ContinueVoting({ context, currentUserId }: Props): React.ReactElement<Props> {
	const winningTopicId = context.topicVoteResults[0]
	const topic = context.topics.find(topic => topic.id === winningTopicId)
	if (!topic) {
		return <></>
	}
  
  return <>
  <Typography component="h2">Continue Discussing?</Typography>
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
      <div>
      <Button onClick={() => {
        if(context.continueVotes[ContinueVote.YES].includes(currentUserId??'')){
          send({type: 'RETRACT_CONTINUE_VOTE'})
        } else {
          send({type: 'PLACE_CONTINUE_VOTE', value: ContinueVote.YES})
        }
      }} >👍</Button>
      <Typography component="p">Current Votes: {context.continueVotes[ContinueVote.YES].length}</Typography>
      </div>
      <div>
      <Button onClick={() => {
        if(context.continueVotes[ContinueVote.NO].includes(currentUserId??'')){
          send({type: 'RETRACT_CONTINUE_VOTE'})
        } else {
          send({type: 'PLACE_CONTINUE_VOTE', value: ContinueVote.NO})
        }
      }}>👎</Button>
      <Typography component="p">Current Votes: {context.continueVotes[ContinueVote.NO].length}</Typography>
      </div>
      <Typography component="p">Abstain Votes: {context.users.length - (context.continueVotes[ContinueVote.NO].length + context.continueVotes[ContinueVote.YES].length)}</Typography>
		<Button color="primary"
		variant="contained" onClick={() => {
			send({type: 'END_CONTINUE_VOTING'})
		}}>End Voting</Button>
    <EndMeetingButton />
	</>
}