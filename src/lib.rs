use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
account_info::{next_account_info, AccountInfo}, entrypoint::{ ProgramResult}, entrypoint, msg, pubkey::Pubkey
};

#[derive(BorshSerialize,BorshDeserialize)]
enum InstructionType{
    Increment(u32),
    Decrement(u32)
}
#[derive(BorshSerialize,BorshDeserialize)]
struct Counter{
    count:u32
}

entrypoint!(counter_contract);

pub fn counter_contract(
    _program_id:&Pubkey,
    accounts:&[AccountInfo],//Adress of array Data account
    instruction_data : &[u8] // bytes of data can come from user represent the request they want to do
)->ProgramResult{
    
    let acc = next_account_info(&mut accounts.iter())?;
    let mut counter  = Counter::try_from_slice(&acc.data.borrow())?;

    match InstructionType::try_from_slice(instruction_data)? {

        InstructionType::Increment(value)=>{
            msg!("Increment Succedd");
            counter.count += value;
        },

        InstructionType::Decrement(value)=>{
            msg!("Decrement Succedd");
            counter.count -= value;
        }

    }

    counter.serialize(&mut *acc.data.borrow_mut())?;
    
    msg!("Contract Succedd");
    Ok(())
}