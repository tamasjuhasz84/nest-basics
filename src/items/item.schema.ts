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
