
import fs from 'fs';
import path from 'path';
import { config } from '../../config';

export class FileLogger {
  private logStream: fs.WriteStream;

  constructor() {
    if (!fs.existsSync(config.logDir)) {
      fs.mkdirSync(config.logDir, { recursive: true });
    }
    this.logStream = fs.createWriteStream(config.logPath, { flags: 'a' });
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logStream.write(`[${timestamp}] ${message}\n`);
  }
}
