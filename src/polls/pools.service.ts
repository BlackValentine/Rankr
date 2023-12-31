import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createNominationID, createPollID, createUserID } from '../ids';
import { PollsRepository } from './polls.repository';
import { AddNominationFields, AddParticipantFields, CreatePollFields, JoinPollFields, RejoinPollFields, SubmitRankingsFields } from './polls.type';
import { Poll } from './poll.interface';
import getResults from './getResults';

@Injectable()
export class PollsService {
  constructor(private readonly pollRepository: PollsRepository, private readonly jwtService: JwtService) {}
  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const newPoll = await this.pollRepository.createPoll({
      ...fields,
      pollID,
      userID,
    });

    const signedString = this.jwtService.sign(
      {
        pollID: newPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      }
    );

    return {
      poll: newPoll,
      accessToken: signedString,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    console.log(`Fetching poll with ID: ${fields.pollID} for user with ID: ${userID}`);

    const joinedPoll = await this.pollRepository.getPoll(fields.pollID);

    const signedString = this.jwtService.sign(
      {
        pollID: joinedPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      }
    );

    return {
      poll: joinedPoll,
      accessToken: signedString,
    };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    console.log(`Fetching poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`);

    const joinedPoll = await this.pollRepository.addParticipant(fields);
    return {
      poll: joinedPoll,
    };
  }

  async addParticipant(addParticipant: AddParticipantFields): Promise<Poll> {
    return this.pollRepository.addParticipant(addParticipant);
  }

  async removeParticipant(pollID: string, userID: string): Promise<Poll | void> {
    const poll = await this.pollRepository.getPoll(pollID);

    if (!poll.hasStarted) {
      const updatedPoll = await this.pollRepository.removeParticipant(pollID, userID);
      return updatedPoll;
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    return this.pollRepository.getPoll(pollID);
  }

  async addNomination({ pollID, userID, text }: AddNominationFields): Promise<Poll> {
    return this.pollRepository.addNomination({
      pollID,
      nominationID: createNominationID(),
      nomination: {
        userID,
        text,
      },
    });
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    return this.pollRepository.removeNomination(pollID, nominationID);
  }

  async startPoll(pollID: string): Promise<Poll> {
    return this.pollRepository.startPoll(pollID);
  }

  async submitRankings(rankingsData: SubmitRankingsFields): Promise<Poll> {
    const hasPollStarted = (await this.pollRepository.getPoll(rankingsData.pollID)).hasStarted;

    if (!hasPollStarted) {
      throw new BadRequestException('Participants cannot rank until the poll has started.');
    }

    return this.pollRepository.addParticipantRankings(rankingsData);
  }

  async computeResults(pollID: string): Promise<Poll> {
    const poll = await this.pollRepository.getPoll(pollID);

    const results = getResults(
      poll.rankings,
      poll.nominations,
      poll.votesPerVoter,
    );

    return this.pollRepository.addResults(pollID, results);
  }

  async cancelPoll(pollID: string): Promise<void> {
    await this.pollRepository.deletePoll(pollID);
  }
}
