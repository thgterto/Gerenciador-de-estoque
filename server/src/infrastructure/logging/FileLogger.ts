
import fs from 'fs';
import path from 'path';

export class FileLogger {
  private logStream: fs.WriteStream;

  constructor() {
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFilePath = path.join(logDir, 'audit.log');
    this.logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logStream.write(`[${timestamp}] ${message}\n`);
  }
}
