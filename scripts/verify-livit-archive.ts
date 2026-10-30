import { runArchiveCli } from '../src/ingestion/archive-cli';
try { process.exitCode = runArchiveCli(process.argv.slice(2)); }
catch (error) { console.error(String(error)); process.exitCode = 1; }
