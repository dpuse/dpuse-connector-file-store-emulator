// ── External Dependencies & Registrations
import { nanoid } from 'nanoid';

// ── DPUse Framework
import { addNumbersWithRust, checksumWithRust } from '@/rustBridge';
import type {
    AuditObjectContentOptions,
    AuditObjectContentResult,
    ConnectionNodeConfig,
    ConnectorConfig,
    ConnectorInterface,
    ConnectorUtilities,
    FindObjectOptions,
    FindObjectResult,
    GetReadableStreamOptions,
    ListNodesOptions,
    ListNodesResult,
    ParsingRecord,
    PreviewConfig,
    PreviewObjectOptions,
    RecordRetrievalTypeId,
    RetrieveRecordsOptions,
    RetrieveRecordsSummary,
    ToolConfig
} from '@dpuse/dpuse-shared';
import {
    buildFetchError,
    ConnectorError,
    extractExtensionFromPath,
    extractNameFromPath,
    loadTool,
    lookupMimeTypeForExtension,
    normalizeToError,
    ORDERED_VALUE_DELIMITER_IDS
} from '@dpuse/dpuse-shared';

// ── DPUse Tools
import type { Tool as CSVParseTool } from '@dpuse/dpuse-tool-adaltas-csv-parser';
import type { Tool as FileOperatorsTool } from '@dpuse/dpuse-tool-file-previewer';
import type { Tool as RustCsvCoreTool } from '@dpuse/dpuse-tool-rust-csv-core-parser';

// ── Data
import config from '~/config.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// File store folder paths.
type FileStoreFolderNode =
    ({ typeId: 'folder'; childCount: number } & { name: string }) | ({ typeId: 'object'; id: string; lastModifiedAt: number; size: number } & { name: string });

type FileStoreFolderPaths = Record<string, FileStoreFolderNode[]>; // File store folder paths.

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const INDEX_URL = 'https://sample-data-eu.dpuse.app/fileStoreIndex.json'; // Lists the file store's folders and files, published with them.
const URL_PREFIX = 'https://sample-data-eu.dpuse.app/fileStore'; // Cloudflare R2 file store directory prefix.

// ── Connectors ───────────────────────────────────────────────────────────────────────────────────────────────────────

export class Connector implements ConnectorInterface {
    #fileStoreFolderPaths: Promise<FileStoreFolderPaths> | undefined; // The file store index, loaded on first use.
    abortController: AbortController | undefined;
    readonly config: ConnectorConfig;
    connectorUtilities: ConnectorUtilities;
    readonly toolConfigs;

    constructor(connectorUtilities: ConnectorUtilities, toolConfigs: ToolConfig[]) {
        this.abortController = undefined;
        this.config = config as ConnectorConfig;
        this.connectorUtilities = connectorUtilities;
        this.toolConfigs = toolConfigs;
    }

    // ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────

    // Abort the currently running operation
    abortOperation(): void {
        if (!this.abortController) return;
        this.abortController.abort();
        this.abortController = undefined;
    }

    // Audit object content
    async auditObjectContent(options: AuditObjectContentOptions, chunk: (rowCount: number) => void): Promise<AuditObjectContentResult> {
        this.abortController = new AbortController();

        try {
            if (options.parsingToolName === 'dpuse-tool-rust-csv-core-parser') {
                // Get the readable stream
                const stream = await this.getReadableStream({ id: '', path: options.path });

                // Load the Rust CSV core tool
                const rustCsvTool = await loadTool<RustCsvCoreTool>(this.toolConfigs, 'rust-csv-core-parser');

                // Choose processing mode based on browser capability
                const options2 = { delimiter: ',', hasHeaders: true };
                const result = options.supportsTransferableStreams
                    ? await rustCsvTool.processWithTransferableStream(stream, options2, chunk)
                    : await rustCsvTool.processWithChunks(stream, options2, chunk);

                return { processedRowCount: result.processedRowCount, durationMs: result.durationMs ?? 0 };
            }

            const csvParseTool = await loadTool<CSVParseTool>(this.toolConfigs, 'adaltas-csv-parser');
            const parseStreamOptions = { delimiter: options.valueDelimiterId, relax_column_count: true, relax_quotes: true };
            const url = `${URL_PREFIX}${options.path}`;
            const summary = await csvParseTool.parseStream(options, parseStreamOptions, url, this.abortController, (parameter) => {
                console.log(parameter);
            });
            console.log('summary', summary);
            // TODO: complete(summary);

            return { processedRowCount: 0, durationMs: 0 };
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            this.abortController = undefined;
        }
    }

    // Find the folder path containing the specified object node
    async findObject(options: FindObjectOptions): Promise<FindObjectResult> {
        const fileStoreFolderPaths = await this.loadFileStoreFolderPaths();
        // Loop through the folder path data checking for an object entry with an identifier equal to the object name.
        for (const folderPath in fileStoreFolderPaths) {
            if (!Object.hasOwn(fileStoreFolderPaths, folderPath)) {
                continue;
            }

            const folderPathNodes = fileStoreFolderPaths[folderPath];
            const folderPathNode = folderPathNodes?.find((folderPathNode) => folderPathNode.typeId === 'object' && folderPathNode.id === options.nodeId);
            if (folderPathNode) return { path: folderPath }; // Found, return folder path.
        }
        throw new Error('Not found.'); // Not found.
    }

    // Get a readable stream for the specified object node path
    async getReadableStream(options: GetReadableStreamOptions): Promise<ReadableStream<Uint8Array>> {
        // Create an abort controller and extract its signal.
        const { signal } = (this.abortController = new AbortController());

        try {
            const response = await fetch(`${URL_PREFIX}${options.path}`, { signal });
            if (!response.ok) {
                throw await buildFetchError(response, `Failed to fetch '${options.path}' file.`, 'dpuse-connector-file-store-emulator|Connector|getReadableStream');
            }
            if (response.body == null) {
                throw new ConnectorError('Readable streams are not supported in this runtime.', 'dpuse-connector-file-store-emulator|Connector|getReadableStream.unsupported');
            }

            // TODO: Remove after testing.
            const xxx = await addNumbersWithRust(12, 56);
            const sum = await checksumWithRust(this.config.version);
            console.log('sum', sum, xxx);

            return response.body;
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            this.abortController = undefined;
        }
    }

    // Lists all nodes (folders and objects) in the specified folder path
    async listNodes(options: ListNodesOptions): Promise<ListNodesResult> {
        const fileStoreFolderPaths = await this.loadFileStoreFolderPaths();
        const folderNodes = fileStoreFolderPaths[options.folderPath] ?? [];
        const connectionNodeConfigs: ConnectionNodeConfig[] = [];
        for (const folderNode of folderNodes) {
            if (folderNode.typeId === 'folder') {
                connectionNodeConfigs.push(constructFolderNodeConfig(options.folderPath, folderNode.name, folderNode.childCount));
            } else {
                connectionNodeConfigs.push(constructObjectNodeConfig(options.folderPath, folderNode.id, folderNode.name, folderNode.lastModifiedAt, folderNode.size));
            }
        }
        return { cursor: undefined, isMore: false, connectionNodeConfigs, totalCount: connectionNodeConfigs.length };
    }

    // Preview the contents of the object node with the specified path
    async previewObject(options: PreviewObjectOptions): Promise<PreviewConfig> {
        // Create an abort controller and extract its signal.
        const { signal } = (this.abortController = new AbortController());

        try {
            const asAt = Date.now();
            const startedAt = performance.now();

            // Preview file to determine file format and decode text.
            const fileOperatorsTool = await loadTool<FileOperatorsTool>(this.toolConfigs, 'file-previewer');
            const filePreviewResult = await fileOperatorsTool.previewFile(`${URL_PREFIX}${options.path}`, signal, options.chunkSize);
            if (filePreviewResult.dataFormatId == null) throw new Error(`File '${options.path}' has unknown type.`);
            if (filePreviewResult.text == null) throw new Error(`File '${options.path}' is empty.`);

            // Parse text, identify delimiters, and produce string value records.
            const csvParseTool = await loadTool<CSVParseTool>(this.toolConfigs, 'adaltas-csv-parser');
            const parseTextResult = await csvParseTool.parseText(filePreviewResult.text, ORDERED_VALUE_DELIMITER_IDS);

            // Infer and cast values for each parsed record.
            const inferenceSummary = this.connectorUtilities.inferDataTypes(parseTextResult.parsedRecords);

            return {
                asAt,
                columnConfigs: inferenceSummary.columnConfigs,
                dataFormatId: filePreviewResult.dataFormatId,
                duration: performance.now() - startedAt,
                encodingId: filePreviewResult.encodingId,
                encodingConfidenceLevel: filePreviewResult.encodingConfidenceLevel,
                fileType: filePreviewResult.fileTypeConfig,
                hasHeaders: inferenceSummary.hasHeaderRow,
                recordDelimiterId: parseTextResult.recordDelimiterId,
                parsedRecords: parseTextResult.parsedRecords,
                inferenceRecords: inferenceSummary.typedRecords,
                size: filePreviewResult.bytes.length,
                text: filePreviewResult.text,
                valueDelimiterId: parseTextResult.valueDelimiterId
            };
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            this.abortController = undefined;
        }
    }
    // Retrieves all records from a CSV object node using streaming and chunked processing
    async retrieveRecords(
        options: RetrieveRecordsOptions,
        chunk: (typeId: RecordRetrievalTypeId, records: ParsingRecord[]) => void,
        complete: (result: RetrieveRecordsSummary) => void
    ): Promise<void> {
        this.abortController = new AbortController();
        try {
            const csvParseTool = await loadTool<CSVParseTool>(this.toolConfigs, 'adaltas-csv-parser');
            const parseStreamOptions = { delimiter: options.valueDelimiterId, info: true, relax_column_count: true, relax_quotes: true };
            const url = `${URL_PREFIX}${options.path}`;
            const summary = await csvParseTool.parseStream(options, parseStreamOptions, url, this.abortController, chunk);
            complete(summary);
        } catch (error) {
            throw normalizeToError(error);
        } finally {
            this.abortController = undefined;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────

    // Loads the file store index once, from beside the files it lists, so it always matches them.
    private loadFileStoreFolderPaths(): Promise<FileStoreFolderPaths> {
        this.#fileStoreFolderPaths ??= this.fetchFileStoreFolderPaths();
        return this.#fileStoreFolderPaths;
    }

    // A failed fetch is not kept, so the next call tries again.
    private async fetchFileStoreFolderPaths(): Promise<FileStoreFolderPaths> {
        try {
            const response = await fetch(INDEX_URL);
            if (!response.ok)
                throw await buildFetchError(response, 'Failed to fetch the file store index.', 'dpuse-connector-file-store-emulator|Connector|fetchFileStoreFolderPaths');
            return (await response.json()) as FileStoreFolderPaths;
        } catch (error) {
            this.#fileStoreFolderPaths = undefined;
            throw normalizeToError(error);
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Construct folder node configuration.
function constructFolderNodeConfig(folderPath: string, name: string, childCount: number): ConnectionNodeConfig {
    return {
        childCount,
        childNodes: [],
        description: '',
        extension: undefined,
        folderPath,
        handle: undefined,
        icon: null,
        iconDark: null,
        id: nanoid(),
        label: name,
        lastModifiedAt: undefined,
        mimeType: undefined,
        name,
        size: undefined,
        typeId: 'folder'
    };
}

// Construct object (file) node configuration.
function constructObjectNodeConfig(folderPath: string, id: string, fullName: string, lastModifiedAt: number, size: number): ConnectionNodeConfig {
    const name = extractNameFromPath(fullName) ?? '';
    const extension = extractExtensionFromPath(fullName);
    const lastModifiedAtTimestamp = lastModifiedAt;
    const mimeType = lookupMimeTypeForExtension(extension);
    return {
        childCount: undefined,
        childNodes: [],
        description: '',
        extension,
        folderPath,
        handle: undefined,
        icon: null,
        iconDark: null,
        id,
        label: fullName,
        lastModifiedAt: lastModifiedAtTimestamp,
        mimeType,
        name,
        size,
        typeId: 'object'
    };
}
