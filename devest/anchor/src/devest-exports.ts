// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import DevestIDL from '../target/idl/devest.json'
import type { Devest } from '../target/types/devest'

// Re-export the generated IDL and type
export { Devest, DevestIDL }

// The programId is imported from the program IDL.
export const DEVEST_PROGRAM_ID = new PublicKey(DevestIDL.address)

// This is a helper function to get the Devest Anchor program.
export function getDevestProgram(provider: AnchorProvider) {
  return new Program(DevestIDL as Devest, provider)
}

// This is a helper function to get the program ID for the Devest program depending on the cluster.
export function getDevestProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Devest program on devnet and testnet.
      return new PublicKey('CounNZdmsQmWh7uVngV9FXW2dZ6zAgbJyYsvBpqbykg')
    case 'mainnet-beta':
    default:
      return DEVEST_PROGRAM_ID
  }
}
