import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditLog, AuditSchema } from "./audit.schema";
import { AuditService } from "./audit.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditSchema }]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
