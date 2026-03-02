import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from "joi";
import { ItemsModule } from "./items/items.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AuditModule } from "./audit/audit.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === "test",
      envFilePath: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().optional(),
      }),
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>("MONGO_URI", { infer: true });
        console.log("[BOOT] NODE_ENV=", process.env.NODE_ENV);
        console.log("[BOOT] process.env.MONGO_URI=", process.env.MONGO_URI);
        console.log("[BOOT] config MONGO_URI=", uri);
        return { uri };
      },
    }),

    ItemsModule,
    AuditModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
