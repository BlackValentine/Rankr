import { Nominations } from "./polls.type";

export type Participants = {
  [participantID: string]: string;
}

export type Rankings = {
  [userID: string]: string[];
}

export type Results = Array<{
  nominationID: string;
  nominationText: string;
  score: number;
}>

export type Poll = {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  adminID: string;
  nominations: Nominations;
  rankings: Rankings;
  results: Results;
  hasStarted: boolean;
}
