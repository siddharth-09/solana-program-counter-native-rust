# Solana Counter Program

A simple counter smart contract built with native Rust for the Solana blockchain. This program demonstrates basic state management and instruction handling on Solana.

## Overview

This program implements a basic counter that can be incremented or decremented by specified values. It showcases fundamental Solana program concepts including:

- Borsh serialization/deserialization
- Account data management
- Instruction parsing
- Program entrypoint handling

## Features

- **Increment**: Increase the counter by a specified value
- **Decrement**: Decrease the counter by a specified value
- **Persistent State**: Counter value is stored on-chain in account data
- **Error Handling**: Proper error propagation using `ProgramResult`

## Program Structure

### Data Structures

```rust
#[derive(BorshSerialize, BorshDeserialize)]
struct Counter {
    count: u32
}
```

The main state structure that holds the counter value.

```rust
#[derive(BorshSerialize, BorshDeserialize)]
enum InstructionType {
    Increment(u32),
    Decrement(u32)
}
```

Defines the available instructions that can be sent to the program.

### Program Logic

The program entry point `counter_contract` handles:
1. Account validation and data extraction
2. Instruction deserialization
3. Counter state updates based on instruction type
4. State persistence back to account data

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable version)
- [Solana CLI tools](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation) (optional, for easier development)

## Dependencies

```toml
[dependencies]
borsh = "0.9"
solana-program = "~1.16"
```

## Building the Program

1. Clone the repository:
```bash
git clone https://github.com/siddharth-09/solana-program-counter-native-rust
cd solana-program-counter-native-rust
```

2. Build the program:
```bash
cargo build-bpf
```

3. Deploy to devnet (optional):
```bash
solana program deploy target/deploy/your_program.so
```

## Usage

### Creating Instructions

To interact with this program, you need to create properly serialized instructions:

**Increment Example:**
```rust
let increment_instruction = InstructionType::Increment(5);
let serialized_data = increment_instruction.try_to_vec().unwrap();
```

**Decrement Example:**
```rust
let decrement_instruction = InstructionType::Decrement(3);
let serialized_data = decrement_instruction.try_to_vec().unwrap();
```

### Account Requirements

The program expects:
- One account containing the counter state data
- The account must be writable and owned by the program
- Account data should be initialized with a `Counter` struct

## Program Flow

1. **Instruction Receipt**: Program receives serialized instruction data
2. **Account Access**: Extracts the counter account from provided accounts
3. **State Deserialization**: Converts account data to `Counter` struct
4. **Instruction Processing**: Matches instruction type and updates counter
5. **State Serialization**: Saves updated counter back to account data
6. **Logging**: Outputs success messages using `msg!` macro

## Error Handling

The program uses Solana's `ProgramResult` for error propagation. Common errors include:
- Account data deserialization failures
- Instruction data parsing errors
- Account access violations

## Logging

The program includes logging statements:
- `"Increment Succeed"` - When increment operation completes
- `"Decrement Succeed"` - When decrement operation completes  
- `"Contract Succeed"` - When the entire program execution completes successfully

## Testing

Create unit tests to verify program functionality:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_increment() {
        // Test increment functionality
    }
    
    #[test]
    fn test_decrement() {
        // Test decrement functionality
    }
}
```

## Security Considerations

- Account ownership validation should be added for production use
- Consider overflow protection for counter operations
- Implement proper access controls if needed
- Validate account data size before operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

[Add your license information here]

## Resources

- [Solana Documentation](https://docs.solana.com/)
- [Borsh Specification](https://borsh.io/)
- [Solana Program Library](https://github.com/solana-labs/solana-program-library)

## Contact

[Add your contact information or links to social profiles]

---

**Note**: This is a basic example program intended for educational purposes. For production use, consider additional security measures, error handling, and access controls.
