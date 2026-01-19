import { DB } from "@db/kysely";
import { Global, Inject, Injectable } from "@nestjs/common";
import { Kysely, PostgresDialect } from "kysely";
import { Pool, types } from "pg";

import { BackendConfig } from "../backend.config";

// Override timestamp parsing to match Prisma's behavior (treat as UTC)
// PostgreSQL TIMESTAMP WITHOUT TIME ZONE type OID = 1114
types.setTypeParser(1114, (val) => new Date(val + "Z"));
// PostgreSQL TIMESTAMP WITH TIME ZONE type OID = 1184
types.setTypeParser(1184, (val) => new Date(val));

@Global()
@Injectable()
export class KyselyService extends Kysely<DB> {
  constructor(
    @Inject(BackendConfig)
    private readonly options: BackendConfig,
  ) {
    super({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: options.DATABASE_URL }),
      }),
    });
  }
}
