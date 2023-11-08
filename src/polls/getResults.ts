import { Rankings, Results } from "./poll.interface";
import { Nominations } from "./polls.type";

export default (rankings: Rankings, nominations: Nominations, votesPerVoter: number): Results => {
    const scores: { [nominationID: string]: number } = {};

    Object.values(rankings).forEach((userRankings) => {
        userRankings.forEach((nominationID, index) => {
            const voteValue = Math.pow(
                (votesPerVoter - 0.5 * index) / votesPerVoter,
                index + 1
            );

            scores[nominationID] = (scores[nominationID] ?? 0) + voteValue;
        })
    })

    // 2. Take nominationID to score mapping, and merge in nominationText
    // and nominationID into value
    const results = Object.entries(scores).map(([nominationID, score]) => ({
        nominationID,
        nominationText: nominations[nominationID].text,
        score
    }));

    // 3. Sort values by score in descending order
    results.sort((res1, res2) => res2.score - res1.score);

    return results;
}