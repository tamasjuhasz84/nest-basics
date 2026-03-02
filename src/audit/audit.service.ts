import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, type ClientSession } from "mongoose";
import { AuditLog, AuditDocument } from "./audit.schema";

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditDocument>,
  ) {}

  async write(
    action: string,
    payload: Record<string, any>,
    session?: ClientSession,
  ) {
    const [doc] = await this.auditModel.create(
      [{ action, payload }],
      session ? { session } : undefined,
    );
    return doc;
  }
}
