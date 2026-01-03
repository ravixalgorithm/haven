type VoteUpdateDetail = {
    id: string;
    score: number;
};

export const VOTE_UPDATE_EVENT = 'snippet-vote-update';

export const dispatchVoteUpdate = (id: string, score: number) => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent<VoteUpdateDetail>(VOTE_UPDATE_EVENT, {
            detail: { id, score }
        });
        window.dispatchEvent(event);
    }
};
