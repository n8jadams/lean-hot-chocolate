import { State, Interpreter, Machine, interpret } from 'xstate'
import { assign } from '@xstate/immer'
import { v4 as uuidv4 } from 'uuid'

const TOTAL_AVAILABLE_TOPIC_VOTES = 1

interface LeanHotChocolateMachineSchema {
  states: {
    lobby: {}
    addingTopics: {}
    topicVoting: {
      states: {
        votingInProgress: {}
        votingComplete: {}
      }
    }
    discussion: {
      states: {
        discussing: {}
        continueVoting: {}
      }
    }
    done: {}
  }
}

type LeanHotChocolateMachineEvent =
  | {
      type: 'USER_JOINED',
			username: string
    }
  | {
      type: 'START_MEETING'
    }
  | {
      type: 'ADD_TOPIC'
      topicName: string
      userId: UserId
    }
  | {
      type: 'READY_TO_VOTE'
    }
  | {
      type: 'PLACE_TOPIC_VOTE'
      userId: UserId
      topicId: string
    }
  | {
      type: 'RETRACT_TOPIC_VOTE'
      userId: UserId
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
      type: 'END_MEETING'
    }

const enum ContinueVote {
  YES,
  NO,
}

type UserId = string

interface User {
  id: UserId
  username: string
  topicVotesAvailable: number
}

interface Topic {
  id: string
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

const leanHotChocolateMachine = Machine<
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
							topicVotesAvailable: TOTAL_AVAILABLE_TOPIC_VOTES
						}
						users.push(newUser)
					})
				}
			}
		},
    addingTopics: {},
    topicVoting: {
      states: {
        votingInProgress: {},
        votingComplete: {},
      },
    },
    discussion: {
      states: {
        discussing: {},
        continueVoting: {},
      },
    },
    done: {},
  }
})

// Machine instance with internal state
const toggleService = interpret(leanHotChocolateMachine)
  .onTransition((state) => {
    // publish(state)
  })
  .onChange((state) => {
    // publish(state)
  })
  .start()
