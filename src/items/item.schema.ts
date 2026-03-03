import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ItemDocument = HydratedDocument<Item>;

@Schema({
  timestamps: true,
})
export class Item {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: false, index: true })
  done!: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

ItemSchema.index({ done: 1, createdAt: -1 }, { name: "idx_done_createdAt" });
ItemSchema.index({ createdAt: -1 }, { name: "idx_createdAt_desc" });
ItemSchema.index(
  { name: 1 },
  {
    name: "uniq_name_if_not_done",
    unique: true,
    partialFilterExpression: { done: false },
  },
);
ItemSchema.index({ name: "text" }, { name: "txt_name", weights: { name: 10 } });
