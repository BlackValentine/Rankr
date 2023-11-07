import { Request } from 'express';
import { Socket } from 'socket.io';

//Service types
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
}

export type JoinPollFields = {
  pollID: string;
  name: string;
}

export type RejoinPollFields = {
  pollID: string;
  userID: string;
  name: string;
}

export type AddParticipantFields = {
  pollID: string;
  userID: string;
  name: string;
}

export type RemoveParticipantFields = {
  pollID: string;
  userID: string;
}

export type AddNominationFields = {
  pollID: string;
  userID: string;
  text: string;
}

//Repository types
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
}

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
}

export type Nomination = {
  userID: string;
  text: string;
}

export type Nominations = {
  [nominationID: string]: Nomination;
}

export type AddNominationData = {
  pollID: string;
  nominationID: string;
  nomination: Nomination;
}

//Guard types
export type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
}

export type RequestWithAuth = Request & AuthPayload;
export type SocketWithAuth = Socket & AuthPayload;