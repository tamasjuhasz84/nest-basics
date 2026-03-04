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
import { LoggerModule } from "nestjs-pino";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

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
        CORS_ORIGIN: Joi.string().optional(),
        CORS_METHODS: Joi.string().optional(),
        CORS_CREDENTIALS: Joi.boolean().optional(),
        COMPRESSION: Joi.boolean().optional(),
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
        if (process.env.NODE_ENV === "test") {
          return { ttl: 30 };
        }

        const redisUrl = config.get<string>("REDIS_URL", { infer: true });

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

    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
            };
          },
          res(res) {
            return {
              statusCode: res.statusCode,
            };
          },
        },

        genReqId: (req) => {
          return (req as any).requestId ?? req.headers["x-request-id"];
        },

        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.headers['set-cookie']",
            "req.headers['x-api-key']",
            "req.headers['x-auth-token']",
            "req.query.token",
            "req.query.access_token",
            "req.query.refresh_token",
            "req.query.api_key",
            "req.query.key",
            "req.query.secret",
            "req.query.password",
            "req.body.password",
            "req.body.token",
            "req.body.refresh_token",
          ],
          censor: "[REDACTED]",
        },

        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: { singleLine: true, colorize: true },
              }
            : undefined,
      },
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
          {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
          },
        ]),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
