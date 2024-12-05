import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Voting } from "../target/types/voting";
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const IDL = require("../target/idl/voting.json");

const votingProgramAddress = new PublicKey(
  "3N6tkCWbmAiVRJFK76WBvfxnjpxuBe2eaCbTcXCsHcMx",
);

describe("voting", () => {
  let context;
  let provider;
  anchor.setProvider(anchor.AnchorProvider.env());
  // let votingProgram: anchor.Program<Voting>;
  let votingProgram = anchor.workspace.Voting as Program<Voting>;

  beforeAll(async () => {
    // context = await startAnchor(
    //   "",
    //   [
    //     {
    //       name: "voting",
    //       programId: votingProgramAddress,
    //     },
    //   ],
    //   [],
    // );
    // provider = new BankrunProvider(context);
    // votingProgram = new Program<Voting>(IDL, provider);
  });
  it("Initialize poll", async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        new anchor.BN(0),
        new anchor.BN(1931876280),
        "What is your favorite type of peanut butter?",
      )
      .rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingProgramAddress,
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual(
      "What is your favorite type of peanut butter?",
    );
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("Initialize Candidate", async () => {
    await votingProgram.methods
      .initializeCandidate("Smooth", new anchor.BN(1))
      .rpc();
    await votingProgram.methods
      .initializeCandidate("Crunchy", new anchor.BN(1))
      .rpc();

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Crunchy")],
      votingProgramAddress,
    );

    const crunchyCandidate =
      await votingProgram.account.candidate.fetch(crunchyAddress);

    console.log(crunchyCandidate);

    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Smooth")],
      votingProgramAddress,
    );

    const smoothCandidate =
      await votingProgram.account.candidate.fetch(smoothAddress);

    console.log(smoothCandidate);

    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("vote", async () => {
    await votingProgram.methods.vote("Smooth", new anchor.BN(1)).rpc();

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Smooth")],
      votingProgramAddress,
    );

    const smoothCandidate =
      await votingProgram.account.candidate.fetch(smoothAddress);

    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
  });
});
