// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { Connector } from '@/index';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Tools are loaded at run time from the engine, so each test supplies the tool it needs. The shared preview, retrieve and
// audit functions have their own tests in dpuse-shared, so here they only record what the connector hands them.
const tools = vi.hoisted((): { byName: Record<string, unknown> } => ({ byName: {} }));
const shared = vi.hoisted(() => ({ auditObjectContentWithParser: vi.fn(), buildPreviewConfig: vi.fn(), retrieveRecordsWithParser: vi.fn() }));
vi.mock('@dpuse/dpuse-shared', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    ...shared,
    loadTool: vi.fn((_toolConfigs: unknown, name: string) => Promise.resolve(tools.byName[name]))
}));

// The WebAssembly module is not built for Node, and preview only calls it while it is being tried out.
vi.mock('@/rustBridge', () => ({ addNumbersWithRust: vi.fn().mockResolvedValue(68), checksumWithRust: vi.fn().mockResolvedValue(0) }));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const INDEX_URL = 'https://sample-data-eu.dpuse.app/fileStoreIndex.json';
const URL_PREFIX = 'https://sample-data-eu.dpuse.app/fileStore';
const OBJECT_PATH = '/WDI_Data.csv';

// A small stand-in for the published file store index.
const FILE_STORE_INDEX = {
    '': [
        { childCount: 1, id: 'encodingSamplesId', name: 'Encoding Samples', typeId: 'folder' },
        { id: 'wdiDataId', lastModifiedAt: 1_700_000_000_000, name: 'WDI_Data.csv', size: 0, typeId: 'object' }
    ],
    '/Encoding Samples': [{ id: 'asciiId', lastModifiedAt: 1_700_000_000_000, mimeType: 'text/plain', name: 'ascii.txt', size: 900, typeId: 'object' }]
};

// Serves the index, and rejects any other request.
function stubIndexFetch(): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn((url: string) => (url === INDEX_URL ? Promise.resolve(Response.json(FILE_STORE_INDEX)) : Promise.reject(new Error('Unexpected fetch.'))));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function createConnector(): Connector {
    const connectorUtilities = {
        constructColumnAuditor: () => ({ auditRecords: vi.fn(), completeAudit: () => [{ id: 'a' }] }),
        inferDataTypes: () => ({ columnConfigs: [{ id: 'a' }], hasHeaderRow: true, typedRecords: [['typed']] })
    };
    return new Connector(connectorUtilities as never, []);
}

describe('Connector', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        tools.byName = {};
        for (const mock of Object.values(shared)) mock.mockReset();
    });

    it('constructs with the static config and no active operation', () => {
        const connector = createConnector();
        expect(connector.config.id).toBe('dpuse-connector-file-store-emulator');
        expect(connector.abortController).toBeUndefined();
    });

    it('aborts a running operation and clears it, and does nothing when none is running', () => {
        const connector = createConnector();
        expect(() => {
            connector.abortOperation();
        }).not.toThrow();

        const abortController = new AbortController();
        connector.abortController = abortController;
        connector.abortOperation();
        expect(abortController.signal.aborted).toBe(true);
        expect(connector.abortController).toBeUndefined();
    });

    describe('listNodes', () => {
        it('lists the folders and files at the root, from the published index', async () => {
            const fetchMock = stubIndexFetch();

            const result = await createConnector().listNodes({ folderPath: '' });

            expect(fetchMock).toHaveBeenCalledWith(INDEX_URL, expect.objectContaining({ signal: expect.any(AbortSignal) as AbortSignal }));
            expect(result.connectionNodeConfigs).toContainEqual(
                expect.objectContaining({ id: 'encodingSamplesId', name: 'Encoding Samples', label: 'Encoding Samples', typeId: 'folder', childCount: 1, folderPath: '' })
            );
            expect(result.connectionNodeConfigs).toContainEqual(
                expect.objectContaining({ id: 'wdiDataId', label: 'WDI_Data.csv', extension: 'csv', mimeType: 'text/csv', size: 0, typeId: 'object' })
            );
            expect(result.totalCount).toBe(result.connectionNodeConfigs.length);
            expect(result.isMore).toBe(false);
        });

        it("takes a file's MIME type from the index, and from its extension only when the index has none", async () => {
            stubIndexFetch();
            const connector = createConnector();

            const rootResult = await connector.listNodes({ folderPath: '' });
            const folderResult = await connector.listNodes({ folderPath: '/Encoding Samples' });

            expect(rootResult.connectionNodeConfigs).toContainEqual(expect.objectContaining({ id: 'wdiDataId', mimeType: 'text/csv' }));
            expect(folderResult.connectionNodeConfigs).toContainEqual(expect.objectContaining({ id: 'asciiId', extension: 'txt', mimeType: 'text/plain' }));
        });

        it('loads the index once for a connector, however many folders it lists', async () => {
            const fetchMock = stubIndexFetch();
            const connector = createConnector();

            await connector.listNodes({ folderPath: '' });
            await connector.listNodes({ folderPath: '/Encoding Samples' });

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('fails clearly when the index cannot be fetched, and tries again on the next call', async () => {
            const notFound = { ok: false, status: 404, statusText: 'Not Found', text: () => Promise.resolve(''), headers: new Headers() };
            const indexResponse = Response.json(FILE_STORE_INDEX);
            vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(notFound).mockResolvedValue(indexResponse));
            const connector = createConnector();

            await expect(connector.listNodes({ folderPath: '' })).rejects.toThrow('Failed to fetch the file store index.');
            const retryResult = await connector.listNodes({ folderPath: '' });
            expect(retryResult.totalCount).toBe(2);
        });

        it('lists nothing for a folder that does not exist', async () => {
            stubIndexFetch();

            const result = await createConnector().listNodes({ folderPath: '/missing' });

            expect(result.connectionNodeConfigs).toEqual([]);
            expect(result.totalCount).toBe(0);
        });
    });

    describe('findObject', () => {
        it('returns the folder holding an object', async () => {
            stubIndexFetch();

            expect(await createConnector().findObject({ nodeId: 'asciiId' } as never)).toEqual({ path: '/Encoding Samples' });
        });

        it('rejects an object that does not exist', async () => {
            stubIndexFetch();

            await expect(createConnector().findObject({ nodeId: 'missing' } as never)).rejects.toThrow("Object 'missing' not found.");
        });
    });

    describe('getReadableStream', () => {
        it('fetches the object and returns its body', async () => {
            const body = new ReadableStream<Uint8Array>();
            const fetchMock = vi.fn().mockResolvedValue({ ok: true, body });
            vi.stubGlobal('fetch', fetchMock);
            const connector = createConnector();

            expect(await connector.getReadableStream({ id: '', path: OBJECT_PATH })).toBe(body);
            expect(fetchMock).toHaveBeenCalledWith(`${URL_PREFIX}${OBJECT_PATH}`, expect.objectContaining({ signal: expect.any(AbortSignal) as AbortSignal }));
            expect(connector.abortController).toBeUndefined();
        });

        it('encodes the path, so a name with a space can be fetched', async () => {
            const fetchMock = vi.fn().mockResolvedValue({ ok: true, body: new ReadableStream<Uint8Array>() });
            vi.stubGlobal('fetch', fetchMock);

            await createConnector().getReadableStream({ id: '', path: '/Type Samples/people.csv' });
            expect(fetchMock).toHaveBeenCalledWith(`${URL_PREFIX}/Type%20Samples/people.csv`, expect.anything());
        });

        it('fails when the response has no body', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: null }));

            await expect(createConnector().getReadableStream({ id: '', path: OBJECT_PATH })).rejects.toThrow('Readable streams are not supported in this runtime.');
        });

        it('fails when the fetch is not successful', async () => {
            const response = { ok: false, status: 404, statusText: 'Not Found', text: () => Promise.resolve(''), headers: new Headers() };
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

            await expect(createConnector().getReadableStream({ id: '', path: OBJECT_PATH })).rejects.toThrow(`Failed to fetch '${OBJECT_PATH}' file.`);
        });
    });

    describe('previewObject', () => {
        it("previews the file with the user's choices, then builds the preview with the parser they chose", async () => {
            const filePreview = { bytes: new Uint8Array(4), dataFormatId: 'dtv', text: 'a,b\n' };
            const previewFile = vi.fn().mockResolvedValue(filePreview);
            tools.byName['file-previewer'] = { previewFile };
            const previewConfig = { dataFormatId: 'dtv' };
            shared.buildPreviewConfig.mockResolvedValue(previewConfig);
            const options = { chunkSize: 4096, dataFormatId: 'dtv', encodingId: 'utf-8', mimeType: 'text/csv', parserId: 'dpuse-tool-adaltas-csv-parser', path: OBJECT_PATH };
            const connector = createConnector();

            expect(await connector.previewObject(options as never)).toBe(previewConfig);
            expect(previewFile).toHaveBeenCalledWith(`${URL_PREFIX}${OBJECT_PATH}`, expect.any(AbortSignal), 4096, 'text/csv', undefined, {
                dataFormatId: 'dtv',
                encodingId: 'utf-8'
            });
            expect(shared.buildPreviewConfig).toHaveBeenCalledWith(expect.objectContaining({ filePreview, parserId: 'dpuse-tool-adaltas-csv-parser', toolConfigs: [] }));
            expect(connector.abortController).toBeUndefined();
        });

        it('passes on a failure and clears the operation', async () => {
            tools.byName['file-previewer'] = { previewFile: vi.fn().mockRejectedValue(new Error('Not readable.')) };
            const connector = createConnector();

            await expect(connector.previewObject({ path: OBJECT_PATH } as never)).rejects.toThrow('Not readable.');
            expect(connector.abortController).toBeUndefined();
        });
    });

    describe('retrieveRecords', () => {
        it('fetches the object, reads it with the parser that read its preview, and reports the summary', async () => {
            const body = new ReadableStream<Uint8Array>();
            const fetchMock = vi.fn().mockResolvedValue({ ok: true, body });
            vi.stubGlobal('fetch', fetchMock);
            const summary = { recordCount: 3 };
            shared.retrieveRecordsWithParser.mockResolvedValue(summary);
            const chunk = vi.fn();
            const complete = vi.fn();
            const options = { dataFormatId: 'dtv', parserId: 'dpuse-tool-adaltas-csv-parser', path: OBJECT_PATH };
            const connector = createConnector();

            await connector.retrieveRecords(options as never, chunk, complete);

            expect(fetchMock).toHaveBeenCalledWith(`${URL_PREFIX}${OBJECT_PATH}`, expect.objectContaining({ signal: expect.any(AbortSignal) as AbortSignal }));
            expect(shared.retrieveRecordsWithParser).toHaveBeenCalledWith({ chunk, options, signal: expect.any(AbortSignal) as AbortSignal, stream: body, toolConfigs: [] });
            expect(complete).toHaveBeenCalledWith(summary);
            expect(connector.abortController).toBeUndefined();
        });

        it('fails when the object cannot be fetched', async () => {
            const response = { ok: false, status: 404, statusText: 'Not Found', text: () => Promise.resolve(''), headers: new Headers() };
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

            await expect(createConnector().retrieveRecords({ path: OBJECT_PATH } as never, vi.fn(), vi.fn())).rejects.toThrow(`Failed to fetch '${OBJECT_PATH}' file.`);
            expect(shared.retrieveRecordsWithParser).not.toHaveBeenCalled();
        });
    });

    describe('auditObjectContent', () => {
        it('fetches the object and audits it with the parser that read its preview', async () => {
            const body = new ReadableStream<Uint8Array>();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }));
            const contentAuditConfig = { recordCount: 2 };
            shared.auditObjectContentWithParser.mockResolvedValue(contentAuditConfig);
            const chunk = vi.fn();
            const options = { dataFormatId: 'dtv', hasHeaders: true, parserId: undefined, path: OBJECT_PATH };
            const connector = createConnector();

            expect(await connector.auditObjectContent(options as never, chunk)).toEqual({ contentAuditConfig });
            expect(shared.auditObjectContentWithParser).toHaveBeenCalledWith(
                expect.objectContaining({ constructColumnAuditor: connector.connectorUtilities.constructColumnAuditor, onProgress: chunk, options, stream: body, toolConfigs: [] })
            );
            expect(connector.abortController).toBeUndefined();
        });

        it('stops the fetch when the operation is aborted', async () => {
            const fetchMock = vi.fn(
                (_url: string, init: { signal: AbortSignal }) =>
                    new Promise((_resolve, reject) => {
                        init.signal.addEventListener('abort', () => {
                            reject(new Error('Aborted.'));
                        });
                    })
            );
            vi.stubGlobal('fetch', fetchMock);
            const connector = createConnector();

            const audit = connector.auditObjectContent({ path: OBJECT_PATH } as never, vi.fn());
            connector.abortOperation();

            await expect(audit).rejects.toThrow('Aborted.');
            expect(shared.auditObjectContentWithParser).not.toHaveBeenCalled();
        });

        it('passes on a failure and clears the operation', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: new ReadableStream<Uint8Array>() }));
            shared.auditObjectContentWithParser.mockRejectedValue(new Error('Bad CSV.'));
            const connector = createConnector();

            await expect(connector.auditObjectContent({ path: OBJECT_PATH } as never, vi.fn())).rejects.toThrow('Bad CSV.');
            expect(connector.abortController).toBeUndefined();
        });
    });
});
