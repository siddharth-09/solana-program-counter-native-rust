import * as borsh from "borsh";

/*    Note   

    Borsh need class and schema to serialize and deserialize 


*/


export class CounterAccount{
    count = 0;

    constructor({count}:{count:number}){
        this.count = count;
    }
}

// export class Instruction {
//   constructor(properties: object) {
//     Object.assign(this, properties);
//   }
// }

// export class Increment extends Instruction {
//   constructor(num1:number) {
//     super({ Increment: { num1 } });
//   }
// }

// export class Decrement extends Instruction {
//   constructor(num1:number) {
//     super({ Decrement: { num1 } });
//   }
// }
// export const InstructionSchema = new Map([
//   [
//     Instruction,
//     {
//       kind: 'enum',
//       field: 'data', // Or any other field name you prefer for the enum variant
//       values: [
//         ['Increment', { struct: { num1: 'u32' } }], // Variant 'Add' with data
//         ['Decrement', { struct: { num1: 'u32'} }] // Variant 'Subtract' with data
//       ],
//     },
//   ],
// ]);


// export const IncrementSchema:borsh.Schema = {
//     enum: [
//         {
//             struct: {
//                 Increment: {
//                     struct: {
//                         num1: 'u32'
//                     }
//                 }
//             }
//         }
//     ]
// };

// export const DecrementSchema:borsh.Schema = {
//     enum : [
//         {
//             struct:{
//                 Decrement : {
//                     struct : {
//                         num1 : 'u32'
//                     }
//                 }
//             }
//         }
//     ]
// }

export const InstructionSchema: borsh.Schema = {
  enum: [
    {
      struct: {
        Increment: {
          struct: {
            num1: 'u32'
          }
        }
      }
    },
    {
      struct: {
        Decrement: {
          struct: {
            num1: 'u32'
          }
        }
      }
    }
  ]
};

// representation : [1,10,0,0] 1 means decrement and 0 means increment


// let x = new CounterAccount({count : 10});
// console.log(x.count);

export const schema:borsh.Schema = {
    struct : {
        count : 'u32'
    }
};

export const COUNTER_SIZE = borsh.serialize(
    schema,
    new CounterAccount({count:0})
).length;
