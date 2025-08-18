import { z } from 'zod';

export interface OptionsDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> {
  schema: T;
  aliases?: Record<string, string> | undefined;
}

export interface CommandDefinition<
  TOptions extends z.ZodObject<any> = z.ZodObject<any>,
  TArgs extends z.ZodType | undefined = undefined,
> {
  description?: string;
  options?: OptionsDefinition<TOptions>;
  args?: TArgs;
  action: (
    options: TOptions extends z.ZodObject<any> ? z.infer<TOptions> : {},
    args: TArgs extends z.ZodType ? z.infer<TArgs> : undefined,
  ) => void | Promise<void>;
}

export interface DefineConfig<
  TGlobalOptions extends z.ZodObject<any> = z.ZodObject<any>,
  TCommands extends Record<string, CommandDefinition<any, any>> = {},
> {
  meta?: {
    name?: string;
    version?: string;
    description?: string;
  };
  globalOptions?: OptionsDefinition<TGlobalOptions>;
  commands: TCommands;
}

export interface ProcessResult<TCommand extends CommandDefinition<any, any> = CommandDefinition<any, any>> {
  globalOptions: any;
  command: TCommand;
  options: any;
  args: any;
}
