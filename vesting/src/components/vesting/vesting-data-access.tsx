"use client";

import { getVestingProgram, getVestingProgramId } from "@project/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Cluster, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import * as anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface CreateVestingArgs {
  companyName: string;
  mint: string;
}

interface CreateEmployeeArgs {
  startTime: number;
  endTime: number;
  totalAmount: number;
  cliffTime: number;
  beneficiary: string;
}

export function useVestingProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const { publicKey } = useWallet();
  const programId = useMemo(
    () => getVestingProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = getVestingProgram(provider);

  const accounts = useQuery({
    queryKey: ["vesting", "all", { cluster }],
    queryFn: () =>
      program.account.vestingAccount.all([
        {
          memcmp: {
            offset: 8,
            bytes: publicKey?.toBase58() ?? "",
          },
        },
      ]),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const createVestingAccount = useMutation<string, Error, CreateVestingArgs>({
    mutationKey: ["vestingAccount", "create", { cluster }],
    mutationFn: ({ companyName, mint }) =>
      program.methods
        .createVestingAccount(companyName)
        .accounts({ mint: new PublicKey(mint), tokenProgram: TOKEN_PROGRAM_ID })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to create vesting account"),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createVestingAccount,
  };
}

export function useVestingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useVestingProgram();

  const accountQuery = useQuery({
    queryKey: ["vesting", "fetch", { cluster, account }],
    queryFn: () => program.account.vestingAccount.fetch(account),
  });

  const createEmployeeVesting = useMutation<string, Error, CreateEmployeeArgs>({
    mutationKey: ["vestingAccount", "create", { cluster }],
    mutationFn: ({ startTime, endTime, totalAmount, cliffTime, beneficiary }) =>
      program.methods
        .createEmployeeAccount(
          new anchor.BN(startTime),
          new anchor.BN(endTime),
          new anchor.BN(totalAmount * 10 ** 9),
          new anchor.BN(cliffTime)
        )
        .accounts({
          beneficiary: new PublicKey(beneficiary),
          vestingAccount: account,
        })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to create vesting account"),
  });

  return {
    accountQuery,
    createEmployeeVesting,
  };
}

export function useEmployeeVesting() {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program } = useVestingProgram();
  const { publicKey } = useWallet();

  const employeeAccounts = useQuery({
    queryKey: ["vesting", "employee", { cluster, account: publicKey }],
    queryFn: () =>
      program.account.employeeAccount.all([
        {
          memcmp: {
            offset: 8, // Skip account discriminator
            bytes: publicKey?.toBase58() ?? "", // The public key we're searching for
          },
        },
      ]),
  });

  const claimTokens = useMutation<string, Error, { companyName: string }>({
    mutationKey: ["vesting", "employee", "claim", { cluster }],
    mutationFn: ({ companyName }) =>
      program.methods
        .claimTokens(companyName)
        .accounts({
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return employeeAccounts.refetch();
    },
    onError: () => toast.error("Failed to claim tokens"),
  });

  return { claimTokens, employeeAccounts };
}
