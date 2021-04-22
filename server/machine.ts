import { Machine, interpret } from 'xstate'
import { assign } from '@xstate/immer'
import { v4 as uuidv4 } from 'uuid'

const TOTAL_AVAILABLE_TOPIC_VOTES = 1
const DISCUSSION_TIME_IN_SEC = 60 * 5

interface LeanHotChocolateMachineSchema {
	states: {
		lobby: {}
		addingTopics: {}
		topicVoting: {}
		discussion: {}
		continueVoting: {}
	}
}

type LeanHotChocolateMachineEvent =
	| {
			type: 'USER_JOINED'
			username: string
		}
	| {
			type: 'START_MEETING'
		}
	| {
			type: 'ADD_TOPIC'
			topicName: string
		}
	| {
			type: 'REMOVE_TOPIC'
			topicId: string
		}
	| {
			type: 'READY_TO_VOTE'
		}
	| {
			type: 'PLACE_TOPIC_VOTE'
			topicId: string
		}
	| {
			type: 'RETRACT_TOPIC_VOTE'
			topicId: string
		}
	| {
			type: 'START_DISCUSSION'
		}
	| {
			type: 'SKIP_TO_NEXT_TOPIC'
		}
	| {
			type: 'PLACE_CONTINUE_VOTE'
			value: ContinueVote
		}
	| {
		type: 'RETRACT_CONTINUE_VOTE'
	} | {
		type: 'END_CONTINUE_VOTING'
	}
	| {
			type: 'END_MEETING'
		}

const enum ContinueVote {
	YES,
	NO
}

type UserId = string

interface User {
	id: UserId
	username: string
	topicVotesAvailable: number
}

interface Topic {
	id: string
	name: string
	createdByUserId: string
	votesCastFor: UserId[]
}

interface LeanHotChocolateMachineContext {
	users: User[]
	topics: Topic[]
	topicVoteResults: string[] // topicIds
	timer: number // number of seconds
	continueVotes: {
		[ContinueVote.YES]: UserId[]
		[ContinueVote.NO]: UserId[]
	}
}

const initialContext: LeanHotChocolateMachineContext = {
	users: [],
	topics: [],
	topicVoteResults: [],
	timer: 0,
	continueVotes: {
		[ContinueVote.YES]: [],
		[ContinueVote.NO]: [],
	},
}

export const leanHotChocolateMachine = Machine<
	LeanHotChocolateMachineContext,
	LeanHotChocolateMachineSchema,
	LeanHotChocolateMachineEvent
>({
	id: 'lean-hot-chocolate',
	initial: 'lobby',
	context: initialContext,
	states: {
		lobby: {
			on: {
				USER_JOINED: {
					actions: assign(({ users }, { username }) => {
						const id = uuidv4()
						/** @TODO - save it as a cookie */
						const newUser: User = {
							id,
							username,
							topicVotesAvailable: TOTAL_AVAILABLE_TOPIC_VOTES,
						}
						users.push(newUser)
					}),
				},
				START_MEETING: {
					target: 'addingTopics',
				},
			},
		},
		addingTopics: {
			on: {
				ADD_TOPIC: {
					actions: assign(({ topics }, { topicName }) => {
						const newTopic: Topic = {
							id: uuidv4(),
							name: topicName,
							createdByUserId: '' /** @TODO - get user id from cookie */,
							votesCastFor: [],
						}
						topics.push(newTopic)
					}),
				},
				REMOVE_TOPIC: {
					actions: assign(({ topics }, { topicId }) => {
						const topicToRemove = topics.find((topic) => topicId === topic.id)
						const userId = '' /** @TODO - get user id from cookie */
						if (topicToRemove.createdByUserId === userId) {
							topics = topics.filter((topic) => topic.id !== topicId)
						}
					}),
				},
				READY_TO_VOTE: {
					target: 'topicVoting',
				},
			},
		},
		topicVoting: {
			on: {
				PLACE_TOPIC_VOTE: {
					actions: assign(({ users, topics }, { topicId }) => {
						const userId = '' /** @TODO - get user id from cookie */
						const userIndex = users.findIndex((user) => userId === user.id)
						const user = users[userIndex]
						if (user && user.topicVotesAvailable > 0) {
							const topicIndex = topics.findIndex(
								(topic) => topicId === topic.id
							)
							if (topicIndex) {
								user.topicVotesAvailable--
								topics[topicIndex].votesCastFor.push(userId)
							}
						}
					}),
				},
				RETRACT_TOPIC_VOTE: {
					actions: assign(({ users, topics }, { topicId }) => {
						const userId = '' /** @TODO - get user id from cookie */
						const userIndex = users.findIndex((user) => userId === user.id)
						const user = users[userIndex]
						if (user) {
							const topicIndex = topics.findIndex(
								(topic) => topicId === topic.id
							)
							const topic = topics[topicIndex]
							const userVotedOnTopic = topic.votesCastFor.includes(userId)
							if (topicIndex && userVotedOnTopic) {
								user.topicVotesAvailable++
								topic.votesCastFor = topic.votesCastFor.filter(
									(votedForUserId) => votedForUserId !== userId
								)
							}
						}
					}),
				},
				START_DISCUSSION: {
					actions: assign(({ topics, topicVoteResults }) => {
						/** @TODO - Handle tiebreaker scenario because order of insertion isn't objective */
						topics = topics.sort((t1, t2) => t1.votesCastFor.length - t2.votesCastFor.length)
						topicVoteResults = topics.map((topic) => topic.id)
					}),
					target: 'discussion',
				},
			},
		},
		discussion: {
			entry: assign(({ timer }) => {
				timer = DISCUSSION_TIME_IN_SEC
			}),
			after: {
				1000: [
					{
						cond: ({ timer }) => {
							return timer === 0
						},
						target: 'continueVoting',
					},
					{
						actions: assign((context) => {
							context.timer--
						}),
					},
				],
			},
			on: {
				SKIP_TO_NEXT_TOPIC: {
					actions: assign(({ topicVoteResults }) => {
						topicVoteResults.shift()
					})
				},
				END_MEETING: {
					target: 'lobby'
				}
			}
		},
		continueVoting: {
			on: {
				PLACE_CONTINUE_VOTE: {
					actions: assign(({ continueVotes }, { value }) => {
						const oppositeVote = value === ContinueVote.YES ? ContinueVote.NO : ContinueVote.YES
						const userId = '' /** @TODO - get user id from cookie */
						if(!continueVotes[value].includes(userId)) {
							continueVotes[oppositeVote] = continueVotes[oppositeVote].filter((votedForUserId) => votedForUserId !== userId)
							continueVotes[value].push(userId)
						}
					})
				},
				RETRACT_CONTINUE_VOTE: {
					actions: assign(({ continueVotes }) => {
						const userId = '' /** @TODO - get user id from cookie */
						continueVotes[ContinueVote.YES] = continueVotes[ContinueVote.YES].filter((votedForUserId) => votedForUserId !== userId)
						continueVotes[ContinueVote.NO] = continueVotes[ContinueVote.NO].filter((votedForUserId) => votedForUserId !== userId)
					})
				},
				END_CONTINUE_VOTING: [
					{
						cond: ({ topicVoteResults }) => topicVoteResults.length === 1,
						target: 'lobby'
					},
					{
						actions: assign(({ topicVoteResults }) => {
							topicVoteResults.shift()
						}),
						target: 'discussion'
					}
				],
				END_MEETING: {
					target: 'lobby'
				}
			}
		}
	}
})