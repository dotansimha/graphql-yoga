/* eslint-disable */
declare module '@prisma/migrate' {
  // https://github.com/prisma/prisma/blob/main/packages/internals/src/cli/types.ts
  class Command {
    public async parse(argv: string[]): Promise<string | Error>;
  }

  // https://github.com/prisma/prisma/blob/main/packages/migrate/src/commands/DbDrop.ts
  class DbDrop extends Command {
    public static new(): DbDrop;
  }

  // https://github.com/prisma/prisma/blob/main/packages/migrate/src/commands/MigrateDev.ts
  class MigrateDev extends Command {
    public static new(): DbDrop;
  }
}
