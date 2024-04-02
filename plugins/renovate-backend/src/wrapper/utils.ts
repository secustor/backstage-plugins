import { ExtractReportOptions } from './types';

export async function extractReport(
  opts: ExtractReportOptions,
): Promise<RenovateReport> {
  const { logStream, logger } = opts;
  return new Promise(resolve => {
    let uncompletedText = '';
    logStream.on('data', (chunk: Buffer) => {
      const text = uncompletedText.concat(chunk.toString());
      const logLines = text.split('\n');

      // if the last element is an empty string, then we have a complete json line so we reset it.
      // else we save it to
      uncompletedText = logLines.pop() ?? '';

      for (const logLine of logLines) {
        const log = JSON.parse(logLine);
        if (log.report) {
          // TODO use schema and reject if report does not fit expectation
          const report = log.report as RenovateReport;
          // do not forward the report to logging
          resolve(report);
        }
        const msg = log.msg;
        delete log.msg;
        // delete logContext as it is the same as runID
        delete log.logContext;
        logger.debug(msg, log);
      }
    });
  });
}
