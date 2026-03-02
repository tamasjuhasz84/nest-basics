import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AuditDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  action!: string; // pl. "ITEM_CREATED"

  @Prop({ type: Object, required: true })
  payload!: Record<string, any>;
}

export const AuditSchema = SchemaFactory.createForClass(AuditLog);
