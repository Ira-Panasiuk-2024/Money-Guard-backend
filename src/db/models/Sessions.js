import { model, Schema } from 'mongoose';

const sessionsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    token: { type: String, required: true, index: true },
    tokenValidUntil: {
      type: Date,
      required: true,
      expires: 3600,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const SessionsCollection = model('session', sessionsSchema);
