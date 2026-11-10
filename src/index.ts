// ── DPUse Framework
import type { AuditObjectContentOptions, AuditObjectContentResult, ConnectionNodeConfig } from '@dpuse/dpuse-shared';
import { auditObjectContentWithParser, buildFetchError, buildPreviewObjectResult } from '@dpuse/dpuse-shared';
import { ConnectorError, extractExtensionFromPath, extractPathWithoutExtension, loadTool } from '@dpuse/dpuse-shared';
import type { ConnectorInterface, ConnectorUtilities, FindObjectOptions, FindObjectResult } from '@dpuse/dpuse-shared';
import type { GetReadableStreamOptions, ListNodesOptions, ListNodesResult, ParsedRecord } from '@dpuse/dpuse-shared';
import { normalizeToError, readTableSchema, retrieveRecordsWithParser } from '@dpuse/dpuse-shared';
import type { PreviewObjectOptions, PreviewObjectResult, RecordRetrievalTypeId } from '@dpuse/dpuse-shared';
import type { RetrieveRecordsOptions, RetrieveRecordsSummary, ToolConfig } from '@dpuse/dpuse-shared';

// ── DPUse Tools
import type { Tool as FilePreviewerTool } from '@dpuse/dpuse-tool-file-previewer';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type FileStoreIndexEntry =
    { typeId: 'folder'; childCount: number; id: string; name: string } | { typeId: 'object'; id: string; lastModifiedAt: number; mimeType: string; name: string; size: number };
type FileStoreIndex = Record<string, FileStoreIndexEntry[]>;
type TableResource = ReturnType<typeof readTableSchema>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const INDEX_URL = 'https://sample-data-eu.dpuse.app/fileStoreIndex.json'; // Fetched from the bucket rather than bundled, so changing the sample files needs no connector release.
const INDEX_TIMEOUT_MS = 30_000; // A stalled index request fails after this, rather than holding up 'listNodes' and 'findObject'.
const URL_PREFIX = 'https://sample-data-eu.dpuse.app/fileStore';
const RESOURCE_FILE_SUFFIX = '.resource.json'; // A file's Data Resource sits beside it, e.g. 'people.resource.json' for 'people.csv'.

// ── Connectors ───────────────────────────────────────────────────────────────────────────────────────────────────────

export class Connector implements ConnectorInterface {
    private pendingFileStoreIndex: Promise<FileStoreIndex> | undefined; // The file store index, loaded on first use.
    private abortController: AbortController | undefined; // The latest operation's. An operation that ends clears it only if no later one has replaced it.
    private readonly connectorUtilities: ConnectorUtilities;
    private readonly toolConfigs;

    constructor(connectorUtilities: ConnectorUtilities, toolConfigs: ToolConfig[]) {
        this.abortController = undefined;
        this.connectorUtilities = connectorUtilities;
        this.toolConfigs = toolConfigs;
    }

    // ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────

    abortOperation(): void {
        if (!this.abortController) return;
        this.abortController.abort();
        this.abortController = undefined;
    }

    async auditObjectContent(options: AuditObjectContentOptions, chunk: (recordCount: number, byteCount: number) => void): Promise<AuditObjectContentResult> {
        const abortController = new AbortController();
        this.abortController = abortController;
        const { signal } = abortController;

        try {
            const tableResource = await this.findTableResource(options.path, signal); // The options already read the file as its resource says, because they come from its preview.
            const stream = await fetchObjectStream(options.path, signal);
            return await auditObjectContentWithParser({
                constructColumnAuditor: this.connectorUtilities.constructColumnAuditor,
                declaredColumnConfigs: tableResource?.declaredColumnConfigs,
                onProgress: chunk,
                options,
                signal,
                stream,
                toolConfigs: this.toolConfigs
            });
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            if (this.abortController === abortController) this.abortController = undefined;
        }
    }

    async findObject(options: FindObjectOptions): Promise<FindObjectResult> {
        const fileStoreIndex = await this.loadFileStoreIndex();
        for (const folderPath in fileStoreIndex) {
            if (!Object.hasOwn(fileStoreIndex, folderPath)) continue;

            const folderPathNodes = fileStoreIndex[folderPath];
            const folderPathNode = folderPathNodes?.find((folderPathNode) => folderPathNode.typeId === 'object' && folderPathNode.id === options.nodeId);
            if (folderPathNode) return { path: folderPath };
        }
        throw new ConnectorError(`Object '${options.nodeId}' not found.`, 'dpuse-connector-file-store-emulator.Connector.findObject');
    }

    async getReadableStream(options: GetReadableStreamOptions): Promise<ReadableStream<Uint8Array>> {
        const abortController = new AbortController();
        this.abortController = abortController;
        const { signal } = abortController;

        try {
            return await fetchObjectStream(options.path, signal);
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            if (this.abortController === abortController) this.abortController = undefined;
        }
    }

    // Lists the folders and files directly inside the folder.
    async listNodes(options: ListNodesOptions): Promise<ListNodesResult> {
        const fileStoreIndex = await this.loadFileStoreIndex();
        const folderNodes = fileStoreIndex[options.folderPath] ?? [];
        const connectionNodeConfigs: ConnectionNodeConfig[] = folderNodes.map((folderNode) =>
            folderNode.typeId === 'folder'
                ? constructFolderNodeConfig(options.folderPath, folderNode.id, folderNode.name, folderNode.childCount)
                : constructObjectNodeConfig(options.folderPath, folderNode.id, folderNode.name, folderNode.lastModifiedAt, folderNode.size, folderNode.mimeType)
        );
        return { cursor: undefined, isMore: false, connectionNodeConfigs, totalCount: connectionNodeConfigs.length };
    }

    async previewObject(options: PreviewObjectOptions): Promise<PreviewObjectResult> {
        const abortController = new AbortController();
        this.abortController = abortController;
        const { signal } = abortController;

        try {
            const asAt = Date.now();
            const startedAt = performance.now();

            // A file's resource says how it is read, in place of the user's choices and of detection. A file without one is
            // read as the user chose, or as detected.
            const tableResource = await this.findTableResource(options.path, signal);
            const declaredReadingConfig = tableResource?.declaredReadingConfig;
            const filePreviewerTool = await loadTool<FilePreviewerTool>(this.toolConfigs, 'file-previewer');
            const filePreview = await filePreviewerTool.previewFile(`${URL_PREFIX}${options.path}`, signal, options.chunkSize, options.mimeType, undefined, {
                dataFormatId: declaredReadingConfig?.dataFormatId ?? options.dataFormatId,
                encodingId: declaredReadingConfig?.encodingId ?? options.encodingId
            });
            return await buildPreviewObjectResult({
                asAt,
                declaredColumnConfigs: tableResource?.declaredColumnConfigs,
                filePreview,
                hasHeaders: declaredReadingConfig?.hasHeaders,
                inferDataTypes: this.connectorUtilities.inferDataTypes,
                parserId: options.parserId,
                startedAt,
                toolConfigs: this.toolConfigs,
                valueDelimiterId: declaredReadingConfig?.valueDelimiterId ?? options.valueDelimiterId
            });
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            if (this.abortController === abortController) this.abortController = undefined;
        }
    }

    // Retrieves all records from the object node, with the tool that read its preview.
    async retrieveRecords(
        options: RetrieveRecordsOptions,
        chunk: (typeId: RecordRetrievalTypeId, records: ParsedRecord[]) => void | Promise<void>, // A returned promise holds the read back until it settles.
        complete: (result: RetrieveRecordsSummary) => void
    ): Promise<void> {
        const abortController = new AbortController();
        this.abortController = abortController;
        const { signal } = abortController;

        try {
            const stream = await fetchObjectStream(options.path, signal);
            complete(await retrieveRecordsWithParser({ chunk, options, signal, stream, toolConfigs: this.toolConfigs }));
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            if (this.abortController === abortController) this.abortController = undefined;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────

    // Fetches the file store index on first use. Later calls, including ones made while the fetch is running, share it.
    private loadFileStoreIndex(): Promise<FileStoreIndex> {
        this.pendingFileStoreIndex ??= this.fetchFileStoreIndex();
        return this.pendingFileStoreIndex;
    }

    // The Data Resource beside a file, read for how the file is read and the columns it holds. The index lists every file,
    // so only a file with a resource beside it costs a fetch.
    private async findTableResource(path: string, signal: AbortSignal): Promise<TableResource | undefined> {
        const resourcePath = `${extractPathWithoutExtension(path) ?? path}${RESOURCE_FILE_SUFFIX}`;
        const separatorIndex = resourcePath.lastIndexOf('/');
        const fileStoreIndex = await this.loadFileStoreIndex();
        const hasResource = fileStoreIndex[resourcePath.slice(0, separatorIndex)]?.some(
            (entry) => entry.typeId === 'object' && entry.name === resourcePath.slice(separatorIndex + 1)
        );
        if (hasResource !== true) return undefined;

        const response = await fetch(encodeURI(`${URL_PREFIX}${resourcePath}`), { signal }); // Encoded as the file's own URL is.
        if (!response.ok) throw await buildFetchError(response, `Failed to fetch '${resourcePath}' resource.`, 'dpuse-connector-file-store-emulator.Connector.findTableResource');
        return readTableSchema((await response.json()) as Parameters<typeof readTableSchema>[0]); // Checked by 'readTableSchema', which rejects a resource without a valid schema.
    }

    // A failed fetch is not kept, so the next call tries again.
    private async fetchFileStoreIndex(): Promise<FileStoreIndex> {
        try {
            const response = await fetch(INDEX_URL, { signal: AbortSignal.timeout(INDEX_TIMEOUT_MS) });
            if (!response.ok) throw await buildFetchError(response, 'Failed to fetch the file store index.', 'dpuse-connector-file-store-emulator.Connector.fetchFileStoreIndex');
            return (await response.json()) as FileStoreIndex; // Not validated, because dpuse-resources generates the index ('scripts/buildIndexes.ts').
        } catch (error) {
            this.pendingFileStoreIndex = undefined;
            if (error instanceof Error && error.name === 'TimeoutError') {
                const message = `Failed to fetch the file store index within ${String(INDEX_TIMEOUT_MS / 1000)} seconds.`;
                throw new ConnectorError(message, 'dpuse-connector-file-store-emulator.Connector.fetchFileStoreIndex.timeout', undefined, { cause: error });
            }
            throw normalizeToError(error);
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Fetches an object's content. Aborting the signal stops the fetch and the reading of the stream it returns.
async function fetchObjectStream(path: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(encodeURI(`${URL_PREFIX}${path}`), { signal }); // Encoded the same way the file previewer encodes its URL, so both fetch the same file. 'encodeURI' leaves '#' and '?' as they are, but the files are managed in dpuse-resources and no name holds them.
    if (!response.ok) throw await buildFetchError(response, `Failed to fetch '${path}' file.`, 'dpuse-connector-file-store-emulator.fetchObjectStream');
    if (response.body == null) throw new ConnectorError('Readable streams are not supported in this runtime.', 'dpuse-connector-file-store-emulator.fetchObjectStream.unsupported');
    return response.body;
}

function constructFolderNodeConfig(folderPath: string, id: string, name: string, childCount: number): ConnectionNodeConfig {
    return {
        childCount,
        description: '',
        extension: undefined,
        folderPath,
        icon: null,
        iconDark: null,
        id,
        label: name,
        lastModifiedAt: undefined,
        mimeType: undefined,
        name,
        size: undefined,
        typeId: 'folder'
    };
}

function constructObjectNodeConfig(folderPath: string, id: string, fullName: string, lastModifiedAt: number, size: number, mimeType: string): ConnectionNodeConfig {
    const name = extractPathWithoutExtension(fullName) ?? '';
    const extension = extractExtensionFromPath(fullName);
    return {
        childCount: undefined,
        description: '',
        extension,
        folderPath,
        icon: null,
        iconDark: null,
        id,
        label: fullName,
        lastModifiedAt,
        mimeType, // The index's type, which matches what the bucket serves.
        name,
        size,
        typeId: 'object'
    };
}
