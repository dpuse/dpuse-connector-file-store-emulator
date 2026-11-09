// ── External Dependencies & Registrations
import { beforeAll, describe, expect, it } from 'vitest';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const INDEX_URL = 'https://sample-data-eu.dpuse.app/fileStoreIndex.json';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The connector reads the published index without checking it, because dpuse-resources generates it. This suite is the
// check instead, so a change to the index's format fails here before it reaches users. It fetches the real index, so it
// is the one connector suite that uses the network.
describe('published file store index', () => {
    let fileStoreIndex: Record<string, unknown[]>;

    beforeAll(async () => {
        const response = await fetch(INDEX_URL);
        expect(response.ok).toBe(true);
        fileStoreIndex = (await response.json()) as Record<string, unknown[]>;
    }, 30_000);

    it('gives every entry the fields the connector reads', () => {
        const invalidEntries = Object.values(fileStoreIndex)
            .flat()
            .filter((entry) => !isFolderEntry(entry) && !isObjectEntry(entry));

        expect(invalidEntries).toEqual([]);
    });

    it('lists the contents of every folder it names, as many as the folder says it holds', () => {
        for (const [folderPath, entries] of Object.entries(fileStoreIndex)) {
            for (const entry of entries) {
                if (!isFolderEntry(entry)) continue;
                expect(fileStoreIndex[`${folderPath}/${entry.name}`]).toHaveLength(entry.childCount);
            }
        }
    });

    // The connector fetches files with 'encodeURI', which leaves '#' and '?' as they are, so a name holding either would
    // fetch the wrong URL.
    it("has no name that 'encodeURI' would leave unsafe in a URL", () => {
        const unsafeNames = Object.values(fileStoreIndex)
            .flat()
            .filter((entry) => (isFolderEntry(entry) || isObjectEntry(entry)) && /[#?]/.test(entry.name));

        expect(unsafeNames).toEqual([]);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isFolderEntry(entry: unknown): entry is { childCount: number; id: string; name: string; typeId: 'folder' } {
    return isRecord(entry) && entry['typeId'] === 'folder' && typeof entry['childCount'] === 'number' && typeof entry['id'] === 'string' && typeof entry['name'] === 'string';
}

function isObjectEntry(entry: unknown): entry is { id: string; lastModifiedAt: number; mimeType: string; name: string; size: number; typeId: 'object' } {
    return (
        isRecord(entry) &&
        entry['typeId'] === 'object' &&
        typeof entry['id'] === 'string' &&
        typeof entry['lastModifiedAt'] === 'number' &&
        typeof entry['mimeType'] === 'string' &&
        typeof entry['name'] === 'string' &&
        typeof entry['size'] === 'number'
    );
}
