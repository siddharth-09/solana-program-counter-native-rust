import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"
import {test} from "bun:test"
import * as borsh from "borsh";
import { InstructionSchema } from "../types";



//Making transaction via user account
test("Counter Client Txn",async()=>{
    let adminAccount = Keypair.generate();
    let programId = new PublicKey("9aN1KaEMbCcTbJrbjuzhZRkfwtnMibPdga8agbuFtm85");
    let existingAccount = new PublicKey("9nXHa2aic1LBgi5y3kJQ97gGdrWtNgzPccx4QMHQ3Z8b");
    const dataSerialize = borsh.serialize(InstructionSchema,{Decrement : {num1 : 10}})
    
    const connection = new Connection("http://127.0.0.1:8899","confirmed");
    let txn = await connection.requestAirdrop(adminAccount.publicKey,LAMPORTS_PER_SOL*20);
    await connection.confirmTransaction(txn);

    const itxn = new TransactionInstruction({
        keys: [
            {
                pubkey: existingAccount,
                isSigner: false,
                isWritable: true
            }
        ],
        programId: programId,
        data: Buffer.from(dataSerialize)
    })
    const CreateTxn = new Transaction();
    CreateTxn.add(itxn);

    const signature = await connection.sendTransaction(CreateTxn, [adminAccount]);
    await connection.confirmTransaction(signature);

    // console.log(dataSerialize);
})