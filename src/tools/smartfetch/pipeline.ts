import { buildCacheKey } from './cache';
import { MAX_BINARY_DOWNLOAD_BYTES, MAX_RESPONSE_BYTES } from './constants';
import {
  buildAllowedOrigins,
  buildPermissionPatterns,
  isDocsLikeUrl,
  type normalizeUrl,
} from './network';

export type SmartfetchRequestPlan = {
  shouldProbeLlmsTxt: boolean;
  permissionPatterns: string[];
  allowedOrigins: Set<string>;
  cacheKey: string;
  binaryDownloadLimit: number;
};

export function createSmartfetchRequestPlan(args: {
  url: string;
  preferLlmsTxt: 'auto' | 'always' | 'never';
  extractMain: boolean;
  saveBinary: boolean;
  normalized: ReturnType<typeof normalizeUrl>;
}) {
  const normalizedUrl = new URL(args.normalized.url);
  const shouldProbeLlmsTxt =
    args.preferLlmsTxt === 'always' ||
    (args.preferLlmsTxt === 'auto' && isDocsLikeUrl(normalizedUrl));
  const permissionPatterns = buildPermissionPatterns(
    args.normalized,
    shouldProbeLlmsTxt,
  );
  return {
    shouldProbeLlmsTxt,
    permissionPatterns,
    allowedOrigins: buildAllowedOrigins(permissionPatterns),
    cacheKey: buildCacheKey(
      args.url,
      args.extractMain,
      args.preferLlmsTxt,
      args.saveBinary,
    ),
    binaryDownloadLimit: args.saveBinary
      ? MAX_RESPONSE_BYTES
      : MAX_BINARY_DOWNLOAD_BYTES,
  } satisfies SmartfetchRequestPlan;
}
