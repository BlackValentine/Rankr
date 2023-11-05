import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createPollID, createUserID } from '../ids';
import { PollsRepository } from './polls.repository';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './polls.type';

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
      accessToken: signedString
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
}
