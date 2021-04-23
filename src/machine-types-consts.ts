export type LeanHotChocolateMachineEvent =
  | {
      type: "USER_JOINED";
      username: string;
    }
  | {
      type: "START_MEETING";
    }
  | {
      type: "ADD_TOPIC";
      topicName: string;
    }
  | {
      type: "REMOVE_TOPIC";
      topicId: string;
    }
  | {
      type: "READY_TO_VOTE";
    }
  | {
      type: "PLACE_TOPIC_VOTE";
      topicId: string;
    }
  | {
      type: "RETRACT_TOPIC_VOTE";
      topicId: string;
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
    }
  | {
      type: "RETRACT_CONTINUE_VOTE";
    }
  | {
      type: "END_CONTINUE_VOTING";
    }
  | {
      type: "END_MEETING";
    };

export enum ContinueVote {
  NO,
  YES,
}
export interface LeanHotChocolateMachineContext {
  users: User[];
  topics: Topic[];
  topicVoteResults: string[]; // topicIds
  timer: number; // number of seconds
  continueVotes: {
    [ContinueVote.YES]: UserId[];
    [ContinueVote.NO]: UserId[];
  };
}

export interface Props {
  context: LeanHotChocolateMachineContext;
  currentUserId?: string;
  setCurrentUserId?: (userId: string) => void;
}

type UserId = string;

export interface User {
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

export const initialContext: LeanHotChocolateMachineContext = {
  users: [],
  topics: [],
  topicVoteResults: [],
  timer: 0,
  continueVotes: {
    [ContinueVote.YES]: [],
    [ContinueVote.NO]: [],
  },
};
