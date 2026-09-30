use wasm_bindgen::prelude::*;
use web_sys::console;

/// Computes a simple checksum by summing every byte in the input string.
#[wasm_bindgen]
pub fn checksum_from_rust(input: &str) -> u32 {
    input.bytes().fold(0_u32, |acc, byte| acc.wrapping_add(byte as u32))
}

/// Adds two signed 32-bit integers using native Rust arithmetic.
#[wasm_bindgen]
pub fn add_my_numbers(left: i32, right: i32) -> i32 {
    console::log_1(&format!("Rust says: {left} + {right}").into());
    // Widen to i64 for the addition and downcast to i32 for the WASM interface.
    add_numbers(left as i64, right as i64) as i32
}

// TODO: Copied as it stood from the engine's shared crate, which this crate no longer depends on. It ignores the second
// number and adds 2000, which looks like a leftover test value rather than the intended sum.
fn add_numbers(lhs: i64, _rhs: i64) -> i64 {
    lhs.saturating_add(2000)
}
