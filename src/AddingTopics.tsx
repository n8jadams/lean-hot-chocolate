import { Button, Card, CardActions, CardContent, TextField, Typography } from '@material-ui/core';
import React from 'react'
import { EndMeetingButton } from './EndMeetingButton';
import { Props } from './machine-types-consts';
import { send } from './send';
import { getUserById } from './utils';

export function AddingTopics({ context, currentUserId }: Props): React.ReactElement<Props> {
	const [topicName, setTopicName] = React.useState('')
	const [error, setError] = React.useState(false)
  
  return <>
  <form noValidate autoComplete="off" onSubmit={(e) => {
				e.preventDefault()

				if (!topicName) {
					setError(true)
					return
				}
				; (async () => {
					await send({ type: 'ADD_TOPIC', topicName})
				})()
        setTopicName(``)
			}}>
				<TextField
					label="topic"
					variant="outlined"
					value={topicName}
					error={error}
					helperText={error ? 'Topic cannot be empty pal' : undefined}
					onChange={(e) => {
						setError(false)
						setTopicName(e.target.value)
					}}
				/>
				<Button variant="contained" color="primary" type="submit">
					Add Topic
				</Button>
			</form>
      <Button color="secondary" onClick={() => {
            send({ type: 'READY_TO_VOTE'})
          }}>Ready To Vote</Button>
      <Typography component="p">Topics added:</Typography>
      {context.topics.map(topic => (<Card key={topic.id} variant="outlined">
        <CardContent>
          <Typography variant="h5" component="h2">
            {topic.name}
          </Typography>
          <Typography color="textSecondary">
            Submitted by: {getUserById(topic.createdByUserId, context.users)?.username ?? ''}
          </Typography>
        </CardContent>
        {topic.createdByUserId === currentUserId &&
          <CardActions>
          <Button size="small" onClick={() => {
            send({ type: 'REMOVE_TOPIC', topicId: topic.id})
          }}>Remove Topic</Button>
        </CardActions>}
      </Card>))}
			<EndMeetingButton />
  </>
}

