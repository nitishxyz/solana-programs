"use client";

import { PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import {
  useEmployeeVesting,
  useVestingProgram,
  useVestingProgramAccount,
} from "./vesting-data-access";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { BN } from "@coral-xyz/anchor";

export function VestingCreate() {
  const { createVestingAccount } = useVestingProgram();
  const [company, setCompany] = useState("");
  const [mint, setMint] = useState("");
  const { publicKey } = useWallet();

  const isFormValid = company.length > 0 && mint.length > 0;

  const handleSubmit = () => {
    if (publicKey && isFormValid) {
      createVestingAccount.mutateAsync({
        companyName: company,
        mint: mint,
      });
    }
  };

  if (!publicKey) {
    return <p>Connect your wallet</p>;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="company name"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="input input-bordered w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="mint address"
        value={mint}
        onChange={(e) => setMint(e.target.value)}
        className="input input-bordered w-full max-w-xs"
      />
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={handleSubmit}
        disabled={createVestingAccount.isPending || !isFormValid}
      >
        Create new vesting account {createVestingAccount.isPending && "..."}
      </button>

      <EmployeeClaimView publicKey={publicKey} />
    </div>
  );
}

export function VestingList() {
  const { accounts, getProgramAccount } = useVestingProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <VestingCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function VestingCard({ account }: { account: PublicKey }) {
  const { accountQuery, createEmployeeVesting } = useVestingProgramAccount({
    account,
  });

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cliffTime, setCliffTime] = useState(0);
  const [beneficiary, setBeneficiary] = useState("");

  const companyName = useMemo(() => {
    return accountQuery.data?.companyName ?? "Unknown";
  }, [accountQuery.data?.companyName]);

  const handleCreateEmployeeVesting = () => {
    // Validate timestamps
    const now = Math.floor(Date.now() / 1000);
    if (startTime < now) {
      toast.error("Start time must be in the future");
      return;
    }
    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }
    if (cliffTime < startTime || cliffTime > endTime) {
      toast.error("Cliff time must be between start and end time");
      return;
    }
    if (totalAmount <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    createEmployeeVesting.mutateAsync({
      startTime,
      endTime,
      totalAmount,
      cliffTime,
      beneficiary,
    });
  };

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            {companyName}
          </h2>
          <div className="card-actions justify-around">
            <input
              type="text"
              placeholder="start time"
              value={startTime || ""}
              onChange={(e) => setStartTime(parseInt(e.target.value))}
              className="input input-bordered w-full max-w-xs"
            />
            <input
              type="text"
              placeholder="endTime time"
              value={endTime || ""}
              onChange={(e) => setEndTime(parseInt(e.target.value))}
              className="input input-bordered w-full max-w-xs"
            />
            <input
              type="text"
              placeholder="total amount"
              value={totalAmount || ""}
              onChange={(e) => setTotalAmount(parseInt(e.target.value))}
              className="input input-bordered w-full max-w-xs"
            />
            <input
              type="text"
              placeholder="cliff time"
              value={cliffTime || ""}
              onChange={(e) => setCliffTime(parseInt(e.target.value))}
              className="input input-bordered w-full max-w-xs"
            />
            <input
              type="text"
              placeholder="Beneficiary Wallet Address"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              className="input input-bordered w-full max-w-xs"
            />
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={handleCreateEmployeeVesting}
              disabled={createEmployeeVesting.isPending}
            >
              Create Employee Vesting Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmployeeClaimView({ publicKey }: { publicKey: PublicKey }) {
  const { employeeAccounts, claimTokens } = useEmployeeVesting();

  if (!publicKey) {
    return <p>Connect your wallet</p>;
  }

  if (employeeAccounts.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }

  return (
    <div>
      {employeeAccounts.data?.map((account) => (
        <EmployeeVestingCard
          key={account.account.vestingAccount.toString()}
          account={account.account}
          claimTokens={claimTokens}
        />
      ))}
    </div>
  );
}

function EmployeeVestingCard({
  account,
  claimTokens,
}: {
  account: {
    beneficiary: PublicKey;
    startTime: BN;
    endTime: BN;
    cliffTime: BN;
    vestingAccount: PublicKey;
    totalAmount: BN;
    totalWithdrawn: BN;
    bump: number;
  };
  claimTokens: ReturnType<typeof useEmployeeVesting>["claimTokens"];
}) {
  const { accountQuery } = useVestingProgramAccount({
    account: account.vestingAccount,
  });

  // Convert from lamports to SOL (or token decimals)
  const normalizedTotal = account.totalAmount.toNumber() / Math.pow(10, 9);
  const normalizedWithdrawn =
    account.totalWithdrawn.toNumber() / Math.pow(10, 9);

  return (
    <div
      key={account.vestingAccount.toString()}
      className="card card-bordered border-base-300 border-4 text-neutral-content"
    >
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          {normalizedWithdrawn.toFixed(2)}/{normalizedTotal.toFixed(2)} SOL
        </div>
        <div className="card-title justify-center  cursor-pointer">
          {account.startTime.toString()} -{account.endTime.toString()}
        </div>

        <div className="card-title justify-center  cursor-pointer">
          {account.cliffTime.toString()}
        </div>

        <div className="card-title justify-center cursor-pointer">
          {account.beneficiary.toString()}
        </div>
      </div>

      <div className="card-actions justify-end">
        <button
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() =>
            claimTokens.mutateAsync({
              companyName: accountQuery.data?.companyName ?? "",
            })
          }
          disabled={claimTokens.isPending || !accountQuery.data?.companyName}
        >
          Claim Tokens from {accountQuery.data?.companyName}
        </button>
      </div>
    </div>
  );
}
