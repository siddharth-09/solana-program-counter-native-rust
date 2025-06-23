import {expect, test} from "bun:test";
import * as borsh from "borsh";
import {Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction} from "@solana/web3.js"
import { COUNTER_SIZE, schema } from "./types";
let adminAccount = Keypair.generate();
let dataAccount = Keypair.generate();


//Creating Data Account
test("ACCOUNT IS initialized" , async()=>{
   let connection = new Connection("http://127.0.0.1:8899","confirmed");
    // const res = await connection.requestAirdrop(adminAccount.publicKey,LAMPORTS_PER_SOL*2)

    const txn = await connection.requestAirdrop(adminAccount.publicKey,LAMPORTS_PER_SOL*2);

    await connection.confirmTransaction(txn);
    //airdrop done

    const programId = new PublicKey("9aN1KaEMbCcTbJrbjuzhZRkfwtnMibPdga8agbuFtm85");
    const lamports = await connection.getMinimumBalanceForRentExemption(COUNTER_SIZE);
    
    const itxn = SystemProgram.createAccount({
        fromPubkey : adminAccount.publicKey,
        lamports,
        space : COUNTER_SIZE,
        programId : programId,
        newAccountPubkey : dataAccount.publicKey
    })
    const createAccountTxn = new Transaction();
    createAccountTxn.add(itxn);
    const signature = await connection.sendTransaction(createAccountTxn,[adminAccount,dataAccount]);

    await connection.confirmTransaction(signature);

    console.log(dataAccount.publicKey.toString());

    const dataAccountInfo = await connection.getAccountInfo(dataAccount.publicKey);
    const counter = borsh.deserialize(schema,dataAccountInfo?.data);
    console.log(counter.count);
})