import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Devest } from "../target/types/devest";
import {
  BanksClient,
  Clock,
  ProgramTestContext,
  startAnchor,
} from "solana-bankrun";

import IDL from "../target/idl/devest.json";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { BankrunProvider } from "anchor-bankrun";
import { createMint, mintTo } from "spl-token-bankrun";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// differene between KeyPair and PublicKey
// Keypair has both private and public key
// PublicKey has only public key and it is used to identify the account

describe("vesting Smart Contract Tests", () => {
  const companyName = "coralxyz";

  let beneficiary: Keypair; // signing key
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: Program<Devest>;
  let banksClient: BanksClient;
  let employer: Keypair; // signing key
  let mint: PublicKey;

  let beneficiaryProvider: BankrunProvider;
  let program2: Program<Devest>;
  let vestingAccountKey: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let employeeAccount: PublicKey;

  beforeAll(async () => {
    beneficiary = new anchor.web3.Keypair();

    // recap: path to the root program, then we have program for deployment, then we have accounts
    context = await startAnchor(
      "", // this is fixtures/vesting.so it can be emplty as this is added to the default path
      [
        {
          name: "devest", // naming program should be whatever the name of the .so file is it shas to match e.g vesting.so in this case
          programId: new PublicKey(IDL.address),
        },
      ],
      [
        {
          address: beneficiary.publicKey,
          info: {
            lamports: 1_000_000_000, //funding default account with 1 billion lamports
            data: Buffer.alloc(0), // empty data
            owner: SYSTEM_PROGRAM_ID, // owner of the account system program
            executable: false, // not executable account because it is not a program
          },
        },
      ],
    );

    provider = new BankrunProvider(context);

    anchor.setProvider(provider);

    program = new Program<Devest>(IDL as Devest, provider);

    banksClient = context.banksClient;

    employer = provider.wallet.payer;

    // so far, we have created a program, a provider, a context, and a banksClient
    // we also need spl token mint that we're going to use as token that we pass between the employer and the beneficiary

    // @ts-expect-error - Type mismatch in spl-token-bankrun and solana banks client
    mint = await createMint(banksClient, employer, employer.publicKey, null, 2);

    beneficiaryProvider = new BankrunProvider(context);
    beneficiaryProvider.wallet = new NodeWallet(beneficiary);

    program2 = new Program<Devest>(IDL as Devest, beneficiaryProvider);

    [vestingAccountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from(companyName)],
      program.programId,
    );

    [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_treasury"), Buffer.from(companyName)],
      program.programId,
    );

    [employeeAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("employee_vesting"),
        beneficiary.publicKey.toBuffer(),
        vestingAccountKey.toBuffer(),
      ],
      program.programId,
    );
  });

  it("should create a vesting account", async () => {
    const tx = await program.methods
      .createVestingAccount(companyName)
      .accounts({
        signer: employer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const vestingAccountData = await program.account.vestingAccount.fetch(
      vestingAccountKey,
      "confirmed",
    );

    console.log("Vesting Account Data: ", vestingAccountData);

    console.log("Create vesting account: ", tx);
  });

  it("should fund the treasury account", async () => {
    const amount = 10_000 * 10 ** 9;
    const mintTx = await mintTo(
      // @ts-expect-error - Type mismatch in spl-token-bankrun and solana banks client
      banksClient,
      employer,
      mint,
      treasuryTokenAccount,
      employer,
      amount,
    );
    console.log("Mint Treasury Token Account: ", mintTx);
  });

  it("should create employee vesting account", async () => {
    const tx2 = await program.methods
      .createEmployeeAccount(new BN(0), new BN(100), new BN(100), new BN(0))
      .accounts({
        beneficiary: beneficiary.publicKey,
        vestingAccount: vestingAccountKey,
      })
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log("Create Employee Account Tx: ", tx2);
    console.log("Employee Account: ", employeeAccount.toBase58());
  });

  it("should claim tokens", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const currentClock = await banksClient.getClock();
    context.setClock(
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        BigInt(1000),
      ),
    );

    const tx3 = await program2.methods
      .claimTokens(companyName)
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Claim Tokens Tx: ", tx3);
  });
});
