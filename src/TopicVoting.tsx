import { Button, Card, CardActions, CardContent, Typography } from "@material-ui/core";
import React from "react";
import { send } from "./send";
import { Props, User } from "./machine-types-consts";
import { getUserById } from "./utils";

export function TopicVoting({ context, currentUserId }: Props): React.ReactElement<Props> {

	const votedForTopic = (votes: string[], userId: string|undefined = ''): boolean => {
		return votes.includes(userId)
	}

	const votesLeft = (currentUserId: string = '', users: User[]): number => {
		const user = getUserById(currentUserId, users)
		return user?.topicVotesAvailable || 0
	}

  return <>
	<Button
		color="primary"
		onClick={() => {
			send({type: 'START_DISCUSSION'})
		}}>
		End voting
	</Button>
	<Typography>Remaining votes: {votesLeft(currentUserId, context.users)}</Typography>
	{context.topics.map((topic) => (
		<Card key={topic.id} variant="outlined">
			<CardContent>
				<meter min="0" max={context.users.length} value={topic.votesCastFor.length}></meter> 
				<Typography>Number of votes: {topic.votesCastFor.length}</Typography>
				<Typography variant="h5" component="h2">
					{topic.name}
				</Typography>
				<Typography color="textSecondary">
					Submitted by:{" "}
					{getUserById(topic.createdByUserId, context.users)?.username ??
					""}
				</Typography>
			</CardContent>
			{votesLeft(currentUserId, context.users) > 0 && !votedForTopic(topic.votesCastFor, currentUserId) && (
				<CardActions>
					<Button
					size="small"
					onClick={() => {
						send({ type: "PLACE_TOPIC_VOTE", topicId: topic.id });
					}}
					>
					Vote
					</Button>
				</CardActions>
			)}
			{
				votedForTopic(topic.votesCastFor, currentUserId)  && (
					<CardActions>
					<Button
					size="small"
					onClick={() => {
						send({ type: "RETRACT_TOPIC_VOTE", topicId: topic.id });
					}}
					>
					Remove Vote
					</Button>
				</CardActions>
				)
			}
	  </Card>
	))
	}
  </>;
}