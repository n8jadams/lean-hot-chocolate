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
      setUserId: () => string;
    }
  | {
      type: "START_MEETING";
    }
  | {
      type: "ADD_TOPIC";
      topicName: string;
      getUserId: () => string;
    }
  | {
      type: "REMOVE_TOPIC";
      topicId: string;
      getUserId: () => string;
    }
  | {
      type: "READY_TO_VOTE";
    }
  | {
      type: "PLACE_TOPIC_VOTE";
      topicId: string;
      getUserId: () => string;
    }
  | {
      type: "RETRACT_TOPIC_VOTE";
      topicId: string;
      getUserId: () => string;
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
      getUserId: () => string;
    }
  | {
      type: "RETRACT_CONTINUE_VOTE";
      getUserId: () => string;
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
  createdByUserId: string;
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
        USER_JOINED: {
          actions: assign(({ users }, { username, setUserId }) => {
            const id = setUserId();

            const newUser: User = {
              id,
              username,
              topicVotesAvailable: TOTAL_AVAILABLE_TOPIC_VOTES,
            };
            users.push(newUser);
          }),
        },
        START_MEETING: {
          target: "addingTopics",
        },
      },
    },
    addingTopics: {
      on: {
        ADD_TOPIC: {
          actions: assign(({ topics }, { topicName, getUserId }) => {
            const newTopic: Topic = {
              id: uuidv4(),
              name: topicName,
              createdByUserId: getUserId(),
              votesCastFor: [],
            };
            topics.push(newTopic);
          }),
        },
        REMOVE_TOPIC: {
          actions: assign(({ topics }, { topicId, getUserId }) => {
            const indexToRemove = topics.findIndex(
              (topic) => topicId === topic.id
            );
            const userId = getUserId();
            if (topics[indexToRemove].createdByUserId === userId) {
              topics.splice(indexToRemove, 1);
            }
          }),
        },
        READY_TO_VOTE: {
          target: "topicVoting",
        },
      },
    },
    topicVoting: {
      on: {
        PLACE_TOPIC_VOTE: {
          actions: assign(({ users, topics }, { topicId, getUserId }) => {
            const userId = getUserId();
            const userIndex = users.findIndex((user) => userId === user.id);
            const user = users[userIndex];
            if (user && user.topicVotesAvailable > 0) {
              const topicIndex = topics.findIndex(
                (topic) => topicId === topic.id
              );
              if (topicIndex !== -1) {
                user.topicVotesAvailable--;
                topics[topicIndex].votesCastFor.push(userId);
              }
            }
          }),
        },
        RETRACT_TOPIC_VOTE: {
          actions: assign(({ users, topics }, { topicId, getUserId }) => {
            const userId = getUserId();
            const userIndex = users.findIndex((user) => userId === user.id);
            const user = users[userIndex];
            if (user) {
              const topicIndex = topics.findIndex(
                (topic) => topicId === topic.id
              );
              const topic = topics[topicIndex];
              const voteCastIndex = topic.votesCastFor.findIndex(
                (vote) => vote === userId
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
              (t1, t2) => t1.votesCastFor.length - t2.votesCastFor.length
            );
            for (const topic of sortedTopics) {
              topicVoteResults.push(topic.id);
            }
          }),
          target: "discussion",
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
          actions: assign(({ continueVotes }, { value, getUserId }) => {
            const oppositeVote =
              value === ContinueVote.YES ? ContinueVote.NO : ContinueVote.YES;
            const userId = getUserId();
            if (!continueVotes[value].includes(userId)) {
              continueVotes[oppositeVote] = continueVotes[oppositeVote].filter(
                (votedForUserId) => votedForUserId !== userId
              );
              continueVotes[value].push(userId);
            }
          }),
        },
        RETRACT_CONTINUE_VOTE: {
          actions: assign(({ continueVotes }, { getUserId }) => {
            const userId = getUserId();
            continueVotes[ContinueVote.YES] = continueVotes[
              ContinueVote.YES
            ].filter((votedForUserId) => votedForUserId !== userId);
            continueVotes[ContinueVote.NO] = continueVotes[
              ContinueVote.NO
            ].filter((votedForUserId) => votedForUserId !== userId);
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
        ],
        END_MEETING: {
          target: "lobby",
        },
      },
    },
  },
});
