import { runCli } from '../src/ingestion/cli';
try { process.exitCode = await runCli(process.argv.slice(2)); }
catch (error) { console.error(String(error)); process.exitCode = 1; }
