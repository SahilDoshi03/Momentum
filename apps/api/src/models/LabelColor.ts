import mongoose, { Schema } from 'mongoose';
import { ILabelColor } from '../types';

const labelColorSchema = new Schema<ILabelColor>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  colorHex: {
    type: String,
    required: true,
    match: /^#[0-9A-Fa-f]{6}$/,
  },
  position: {
    type: Number,
    required: true,
    default: 0,
  },
});

// Indexes
labelColorSchema.index({ position: 1 });

export const LabelColor = mongoose.model<ILabelColor>('LabelColor', labelColorSchema);



