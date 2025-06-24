import { DB } from "@db/kysely";
import { Global, Inject, Injectable, Logger } from "@nestjs/common";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { BackendConfig } from "../backend.config";

@Global()
@Injectable()
export class KyselyService extends Kysely<DB> {
  logger = new Logger(KyselyService.name);

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
