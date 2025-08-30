import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage {
  sender: Types.ObjectId;
  content: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'location';
  isRead: boolean;
}

export interface IChat extends Document {
  errand: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];
  lastMessage?: IMessage;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

const ChatSchema = new Schema<IChat>({
  errand: {
    type: Schema.Types.ObjectId,
    ref: 'Errand',
    required: true,
    unique: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [MessageSchema],
  lastMessage: MessageSchema
}, {
  timestamps: true
});

// Index for efficient chat queries
ChatSchema.index({ errand: 1 });
ChatSchema.index({ participants: 1 });
ChatSchema.index({ 'messages.timestamp': -1 });

export default mongoose.model<IChat>('Chat', ChatSchema);