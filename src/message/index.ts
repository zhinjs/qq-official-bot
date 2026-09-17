/**
 * 消息系统入口文件
 */
export { MessageBuilder } from './builder';
export { FileProcessor } from './file-processor';
export { PrivateMessageStream } from './stream';
export { Message } from './parser';

export type { MessagePayload, FilePayload, BuildResult } from './builder';
export type { FileUploadResult, UploadOptions, UploadPrepareResult, UploadPart, UploadConfig, MediaFileType } from './file-processor';
export type { MessageArkData, MessageArkType } from './parser';
export { inferMediaFileType } from './file-processor';
export type {
    StreamInputMode,
    StreamContentType,
    StreamInputState,
    StreamMessagePayload,
    StreamMessageResult,
    StreamMessageExtInfo,
    CreatePrivateStreamOptions,
} from './stream';
