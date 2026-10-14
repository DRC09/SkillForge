import pc from 'picocolors';

export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  step(message: string): void;
  raw(message: string): void;
}

class ConsoleLogger implements Logger {
  private silent = false;

  public setSilent(silent: boolean): void {
    this.silent = silent;
  }

  public info(message: string): void {
    if (!this.silent) {
      process.stdout.write(`${pc.blue('ℹ')} ${message}\n`);
    }
  }

  public success(message: string): void {
    if (!this.silent) {
      process.stdout.write(`${pc.green('✔')} ${message}\n`);
    }
  }

  public warn(message: string): void {
    if (!this.silent) {
      process.stdout.write(`${pc.yellow('⚠')} ${message}\n`);
    }
  }

  public error(message: string): void {
    if (!this.silent) {
      process.stderr.write(`${pc.red('✖')} ${message}\n`);
    }
  }

  public step(message: string): void {
    if (!this.silent) {
      process.stdout.write(`${pc.cyan('→')} ${message}\n`);
    }
  }

  public raw(message: string): void {
    if (!this.silent) {
      process.stdout.write(`${message}\n`);
    }
  }
}

export const logger = new ConsoleLogger();
