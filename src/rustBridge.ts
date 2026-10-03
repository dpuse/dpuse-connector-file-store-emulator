// ── Local Framework
import type * as RustModule from '../rust/dpuse_connector_file_store_emulator_core/pkg/dpuse_connector_file_store_emulator_core.js';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type RustBindings = typeof RustModule;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

let rustBindingsPromise: Promise<RustBindings> | undefined;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function addNumbersWithRust(left: number, right: number): Promise<number> {
    const { add_my_numbers } = await loadRustBindings();
    console.log(1111, left, right);
    const yyyy = add_my_numbers(Math.trunc(left), Math.trunc(right));
    console.log(2222, yyyy);
    return yyyy;
}

export async function checksumWithRust(input: string): Promise<number> {
    const { checksum_from_rust } = await loadRustBindings();
    return checksum_from_rust(input);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The WebAssembly loads once, on first use; the promise is kept so callers that arrive together share one load.
async function loadRustBindings(): Promise<RustBindings> {
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Loads the Rust bindings once, then shares the same promise.
    rustBindingsPromise ??= (async (): Promise<RustBindings> => {
        const module = await import('../rust/dpuse_connector_file_store_emulator_core/pkg/dpuse_connector_file_store_emulator_core.js');
        await module.default(); // Fetches and compiles the .wasm file; '--target web' leaves this to the caller.
        return module;
    })();
    return rustBindingsPromise;
}
