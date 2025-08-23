import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { processConfig, defineConfig, defineCommand, defineOptions } from './index.js';

describe('index', () => {
  // Mock console methods
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  it('should parse boolean flags', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              verbose: z.boolean().default(false),
              debug: z.boolean().default(false),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--verbose', '--debug']);
    expect(result.options).toEqual({ verbose: true, debug: true });
  });

  it('should parse flags with values', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              name: z.string(),
              count: z.string(),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--name', 'test', '--count', '5']);
    expect(result.options).toEqual({ name: 'test', count: '5' });
  });

  it('should parse flags with equals syntax', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              name: z.string(),
              count: z.string(),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--name=test', '--count=5']);
    expect(result.options).toEqual({ name: 'test', count: '5' });
  });

  it('should handle aliases', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              verbose: z.boolean().default(false),
              name: z.string(),
            }),
            { v: 'verbose', n: 'name' },
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '-v', '-n', 'test']);
    expect(result.options).toEqual({ verbose: true, name: 'test' });
  });

  it('should handle array options with a single value', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              files: z.array(z.string()),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--files', 'a.txt']);
    expect(result.options).toEqual({ files: ['a.txt'] });
  });

  it('should handle array options with multiple values', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              files: z.array(z.string()),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--files', 'a.txt', '--files', 'b.txt']);
    expect(result.options).toEqual({ files: ['a.txt', 'b.txt'] });
  });

  it('should handle complex equals syntax', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              env: z.string(),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--env=NODE_ENV=production']);
    expect(result.options).toEqual({ env: 'NODE_ENV=production' });
  });

  it('should process a simple command with options', () => {
    const config = defineConfig({
      meta: { name: 'test-cli', version: '1.0.0' },
      commands: {
        create: defineCommand({
          description: 'Create something',
          options: defineOptions(
            z.object({
              name: z.string(),
              verbose: z.boolean().default(false),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['create', '--name', 'test']);

    expect(result.command.description).toBe('Create something');
    expect(result.options).toEqual({ name: 'test', verbose: false });
    expect(result.args).toEqual([]);
  });

  it('should handle kebab-case flags', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              androidMax: z.string(),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--android-max', '10']);
    expect(result.options).toEqual({ androidMax: '10' });
  });

  it('should validate and parse arguments', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          args: z.tuple([z.string(), z.string().transform((s) => parseInt(s, 10) * 2)]),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', 'hello', '5']);
    expect(result.args).toEqual(['hello', 10]);
  });

  it('should throw error for unknown command', () => {
    const config = defineConfig({
      commands: {
        create: defineCommand({ action: vi.fn() }),
      },
    });

    expect(() => processConfig(config, ['unknown'])).toThrow(/Unknown command:.*unknown/);
  });

  it('should throw error for missing command', () => {
    const config = defineConfig({
      commands: {
        create: defineCommand({ action: vi.fn() }),
      },
    });

    expect(() => processConfig(config, [])).toThrow('No command specified.');
  });

  it('should normalize single values to arrays', () => {
    const config = defineConfig({
      commands: {
        test: defineCommand({
          options: defineOptions(
            z.object({
              files: z.array(z.string()),
            }),
          ),
          action: vi.fn(),
        }),
      },
    });

    const result = processConfig(config, ['test', '--files', 'single.txt']);
    expect(result.options).toEqual({ files: ['single.txt'] });
  });

  it('should use default command when no command is specified', () => {
    const defaultCommand = defineCommand({
      description: 'Default command',
      options: defineOptions(
        z.object({
          name: z.string().default('world'),
        }),
      ),
      action: vi.fn(),
    });

    const config = defineConfig({
      commands: {
        greet: defaultCommand,
      },
      defaultCommand,
    });

    const result = processConfig(config, ['--name', 'Alice']);
    expect(result.command).toBe(defaultCommand);
    expect(result.options).toEqual({ name: 'Alice' });
    expect(result.args).toEqual([]);
  });

  it('should still show help when --help is passed with default command', () => {
    const defaultCommand = defineCommand({
      description: 'Default command',
      action: vi.fn(),
    });

    const config = defineConfig({
      commands: {
        greet: defaultCommand,
      },
      defaultCommand,
    });

    expect(() => processConfig(config, ['--help'])).toThrow('process.exit called');
    expect(console.log).toHaveBeenCalled();
  });

  it('should throw error for unknown command even with default command configured', () => {
    const defaultCommand = defineCommand({
      description: 'Default command',
      action: vi.fn(),
    });

    const config = defineConfig({
      commands: {
        greet: defaultCommand,
      },
      defaultCommand,
    });

    expect(() => processConfig(config, ['unknown'])).toThrow(/Unknown command:.*unknown/);
  });
});
