import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ItemDocument = HydratedDocument<Item>;

@Schema({ timestamps: true })
export class Item {
  @Prop({ required: true })
  name!: string;

  @Prop({ default: false })
  done!: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

ItemSchema.index({ done: 1, createdAt: -1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { done: false } },
);
ItemSchema.index({ name: "text" });
