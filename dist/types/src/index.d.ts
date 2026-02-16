import { EngineUtilities } from '@datapos/datapos-shared/engine';
import { AuditObjectContentOptions, AuditObjectContentResult, ConnectorConfig, ConnectorInterface, FindObjectOptions, FindObjectResult, GetReadableStreamOptions, ListNodesOptions, ListNodesResult, PreviewObjectOptions, RetrieveRecordsOptions, RetrieveRecordsSummary } from '@datapos/datapos-shared/component/connector';
import { ToolConfig } from '@datapos/datapos-shared/component/tool';
import { ParsingRecord, PreviewConfig } from '@datapos/datapos-shared/component/dataView';
export declare class Connector implements ConnectorInterface {
    abortController: AbortController | undefined;
    readonly config: ConnectorConfig;
    engineUtilities: EngineUtilities;
    readonly toolConfigs: ToolConfig[];
    constructor(engineUtilities: EngineUtilities, toolConfigs: ToolConfig[]);
    abortOperation(): void;
    auditObjectContent(options: AuditObjectContentOptions, chunk: (rowCount: number) => void): Promise<AuditObjectContentResult>;
    findObject(options: FindObjectOptions): Promise<FindObjectResult>;
    getReadableStream(options: GetReadableStreamOptions): Promise<ReadableStream<Uint8Array>>;
    listNodes(options: ListNodesOptions): Promise<ListNodesResult>;
    previewObject(options: PreviewObjectOptions): Promise<PreviewConfig>;
    retrieveRecords(options: RetrieveRecordsOptions, chunk: (records: ParsingRecord[]) => void, complete: (result: RetrieveRecordsSummary) => void): Promise<void>;
}
