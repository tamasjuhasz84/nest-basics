import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from "joi";
import { ItemsModule } from "./items/items.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AuditModule } from "./audit/audit.module";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-ioredis-yet";
import type { CacheModuleOptions } from "@nestjs/cache-manager";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      envFilePath: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().optional(),
        REDIS_URL: Joi.string().optional(),
      }),
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>("MONGO_URI", { infer: true });
        const nodeEnv = process.env.NODE_ENV ?? "development";
        const isProd = nodeEnv === "production";

        return {
          uri,
          autoIndex: !isProd,
        };
      },
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (
        config: ConfigService,
      ): Promise<CacheModuleOptions> => {
        // TEST: mindig in-memory, hogy a tesztek ne függjenek Redis-től
        if (process.env.NODE_ENV === "test") {
          return { ttl: 30 };
        }

        const redisUrl = config.get<string>("REDIS_URL", { infer: true });

        // ha nincs redis, fallback memory
        if (!redisUrl) {
          return { ttl: 30 };
        }

        return {
          ttl: 30,
          store: await redisStore({ url: redisUrl }),
        };
      },
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: process.env.NODE_ENV === "test" ? 60_000 : 60_000,
          limit: process.env.NODE_ENV === "test" ? 2 : 60,
        },
      ],
    }),

    ItemsModule,
    AuditModule,
  ],
  providers: [
    ...(process.env.NODE_ENV === "test"
      ? []
      : [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
