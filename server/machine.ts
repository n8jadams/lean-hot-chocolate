import { Machine } from "xstate";
import { assign } from "@xstate/immer";
import { v4 as uuidv4 } from "uuid";

const TOTAL_AVAILABLE_TOPIC_VOTES = 1;
const DISCUSSION_TIME_IN_SEC = 5;

interface LeanHotChocolateMachineSchema {
  states: {
    lobby: {};
    addingTopics: {};
    topicVoting: {};
    discussion: {
      states: {
        determineContinue: {};
        decrementTimer: {};
      };
    };
    continueVoting: {};
  };
}

type LeanHotChocolateMachineEvent =
  | {
      type: "USER_JOINED";
      username: string;
      currentUserId: string;
    }
  | {
    type: "USER_LEFT";
    currentUserId: string;
  }
  | {
      type: "START_MEETING";
    }
  | {
      type: "ADD_TOPIC";
      topicName: string;
      currentUserId: string;
    }
  | {
      type: "REMOVE_TOPIC";
      topicId: string;
      currentUserId: string;
    }
  | {
      type: "READY_TO_VOTE";
    }
  | {
      type: "PLACE_TOPIC_VOTE";
      topicId: string;
      currentUserId: string;
    }
  | {
      type: "RETRACT_TOPIC_VOTE";
      topicId: string;
      currentUserId: string;
    }
  | {
      type: "START_DISCUSSION";
    }
  | {
      type: "SKIP_TO_NEXT_TOPIC";
    }
  | {
      type: "PLACE_CONTINUE_VOTE";
      value: ContinueVote;
      currentUserId: string;
    }
  | {
      type: "RETRACT_CONTINUE_VOTE";
      currentUserId: string;
    }
  | {
      type: "END_CONTINUE_VOTING";
    }
  | {
      type: "END_MEETING";
    };

const enum ContinueVote {
  NO,
  YES,
}

type UserId = string;

interface User {
  id: UserId;
  username: string;
  topicVotesAvailable: number;
}

interface Topic {
  id: string;
  name: string;
  createdByUser: User;
  votesCastFor: UserId[];
}

interface LeanHotChocolateMachineContext {
  users: User[];
  topics: Topic[];
  topicVoteResults: string[]; // topicIds
  timer: number; // number of seconds
  continueVotes: {
    [ContinueVote.YES]: UserId[];
    [ContinueVote.NO]: UserId[];
  };
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
};

export const leanHotChocolateMachine = Machine<
  LeanHotChocolateMachineContext,
  LeanHotChocolateMachineSchema,
  LeanHotChocolateMachineEvent
>({
  id: "lean-hot-chocolate",
  initial: "lobby",
  context: initialContext,
  states: {
    lobby: {
      entry: assign((context) => {
        context.topics = [];
        context.topicVoteResults = [];
        for (let i = 0; i < context.users.length; i++) {
          context.users[i].topicVotesAvailable = TOTAL_AVAILABLE_TOPIC_VOTES;
        }
      }),
      on: {
        START_MEETING: {
          target: "addingTopics",
        },
      },
    },
    addingTopics: {
      on: {
        ADD_TOPIC: {
          actions: assign(({ users, topics }, { topicName, currentUserId }) => {
            const createdByUser = users.find(user => user.id === currentUserId)
            const newTopic: Topic = {
              id: uuidv4(),
              name: topicName,
              createdByUser,
              votesCastFor: [],
            };
            topics.push(newTopic);
          }),
        },
        REMOVE_TOPIC: {
          actions: assign(({ topics }, { topicId, currentUserId }) => {
            const indexToRemove = topics.findIndex(
              (topic) => topicId === topic.id
            );
            if (topics[indexToRemove].createdByUser.id === currentUserId) {
              topics.splice(indexToRemove, 1);
            }
          }),
        },
        READY_TO_VOTE: {
          target: "topicVoting",
          cond: ({ topics }) => topics.length > 0
        },
      },
    },
    topicVoting: {
      on: {
        PLACE_TOPIC_VOTE: {
          actions: assign(({ users, topics }, { topicId, currentUserId }) => {
            const userIndex = users.findIndex((user) => currentUserId === user.id);
            const user = users[userIndex];
            if (user && user.topicVotesAvailable > 0) {
              const topicIndex = topics.findIndex(
                (topic) => topicId === topic.id
              );
              if (topicIndex !== -1) {
                user.topicVotesAvailable--;
                topics[topicIndex].votesCastFor.push(currentUserId);
              }
            }
          }),
        },
        RETRACT_TOPIC_VOTE: {
          actions: assign(({ users, topics }, { topicId, currentUserId }) => {
            const userIndex = users.findIndex((user) => currentUserId === user.id);
            const user = users[userIndex];
            if (user) {
              const topicIndex = topics.findIndex(
                (topic) => topicId === topic.id
              );
              const topic = topics[topicIndex];
              const voteCastIndex = topic.votesCastFor.findIndex(
                (vote) => vote === currentUserId
              );
              if (topicIndex !== -1 && voteCastIndex !== -1) {
                user.topicVotesAvailable++;
                topics[topicIndex].votesCastFor.splice(voteCastIndex, 1);
              }
            }
          }),
        },
        START_DISCUSSION: {
          actions: assign(({ topics, topicVoteResults }) => {
            /** @TODO - Handle tiebreaker scenario because order of insertion isn't objective */
            const sortedTopics = topics.sort(
              (t1, t2) => t2.votesCastFor.length - t1.votesCastFor.length
            );
            for (const topic of sortedTopics) {
              topicVoteResults.push(topic.id);
            }
          }),
          target: "discussion"
        },
      },
    },
    discussion: {
      initial: "determineContinue",
      entry: assign((context) => {
        context.timer = DISCUSSION_TIME_IN_SEC;
        context.continueVotes = {
          [ContinueVote.YES]: [],
          [ContinueVote.NO]: [],
        };
      }),
      states: {
        determineContinue: {
          always: [
            {
              cond: ({ timer }) => {
                return timer === 0;
              },
              target: "#continueVoting",
            },
            {
              target: "decrementTimer",
            },
          ],
        },
        decrementTimer: {
          after: {
            1000: {
              actions: assign((context) => {
                context.timer--;
              }),
              target: "determineContinue",
            },
          },
        },
      },
      on: {
        SKIP_TO_NEXT_TOPIC: [
          {
            cond: ({ topicVoteResults }) => topicVoteResults.length === 1,
            target: "lobby",
          },
          {
            actions: assign(({ topicVoteResults }) => {
              topicVoteResults.shift();
            }),
            target: "discussion",
          },
        ],
        END_MEETING: {
          target: "lobby",
        },
      },
    },
    continueVoting: {
      id: "continueVoting",
      on: {
        PLACE_CONTINUE_VOTE: {
          actions: assign(({ continueVotes }, { value, currentUserId }) => {
            const oppositeVote =
              value === ContinueVote.YES ? ContinueVote.NO : ContinueVote.YES;
            if (!continueVotes[value].includes(currentUserId)) {
              continueVotes[oppositeVote] = continueVotes[oppositeVote].filter(
                (votedForUserId) => votedForUserId !== currentUserId
              );
              continueVotes[value].push(currentUserId);
            }
          }),
        },
        RETRACT_CONTINUE_VOTE: {
          actions: assign(({ continueVotes }, { currentUserId }) => {
            continueVotes[ContinueVote.YES] = continueVotes[
              ContinueVote.YES
            ].filter((votedForUserId) => votedForUserId !== currentUserId);
            continueVotes[ContinueVote.NO] = continueVotes[
              ContinueVote.NO
            ].filter((votedForUserId) => votedForUserId !== currentUserId);
          }),
        },
        END_CONTINUE_VOTING: [
          {
            cond: ({ topicVoteResults, continueVotes }) =>
              topicVoteResults.length === 1 &&
              continueVotes[ContinueVote.NO].length >
                continueVotes[ContinueVote.YES].length,
            target: "lobby",
          },
          {
            actions: assign(({ topicVoteResults, continueVotes }) => {
              if (
                continueVotes[ContinueVote.NO].length >
                continueVotes[ContinueVote.YES].length
              ) {
                topicVoteResults.shift();
              }
            }),
            target: "discussion",
          },
        ]
      },
    },
  },
  on: {
    USER_JOINED: {
      actions: assign(({ users }, { username, currentUserId }) => {
        const userExists = users.some(user => user.id === currentUserId)
        if(!userExists) {
          const newUser: User = {
            id: currentUserId,
            username,
            topicVotesAvailable: TOTAL_AVAILABLE_TOPIC_VOTES,
          };
          users.push(newUser);
        }
      }),
    },
    USER_LEFT: {
      actions: assign((context, { currentUserId }) => {
        context.users = context.users.filter((user) => user.id !== currentUserId)
        context.topics = context.topics.map((topic) => {
          return {
            ...topic,
            votesCastFor: topic.votesCastFor.filter((vote) => vote !== currentUserId)
          }
        })
        context.continueVotes = {
          [ContinueVote.YES]: context.continueVotes[ContinueVote.YES].filter((vote) => vote !== currentUserId),
          [ContinueVote.NO]: context.continueVotes[ContinueVote.NO].filter((vote) => vote !== currentUserId)
        }
      })
    },
    END_MEETING: {
      target: "lobby",
    }
  },
});
