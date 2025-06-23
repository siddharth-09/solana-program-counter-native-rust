import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as borsh from "borsh";

//For viewing all accounts linked to programid on cmd
const { Connection, PublicKey } = require('@solana/web3.js');

const connection = new Connection("http://127.0.0.1:8899"); // or devnet/testnet
const programId = new PublicKey("9aN1KaEMbCcTbJrbjuzhZRkfwtnMibPdga8agbuFtm85");

async function getAllProgramAccounts() {
    const accounts = await connection.getProgramAccounts(programId);

    accounts.forEach((account, i) => {
        console.log(`Account ${i + 1}:`);
        console.log("Pubkey:", account.pubkey.toBase58());
        console.log("Lamports:", (account.account.lamports)/LAMPORTS_PER_SOL);
        console.log("Data Length:", Array.from(account.account.data));
        console.log("---------------------------");
    });
}

getAllProgramAccounts();