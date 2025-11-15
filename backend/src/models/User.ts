import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  password: {
    type: String,
    required: function(this: any): boolean {
      return !this.googleId;
    },
    minlength: 6,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  initials: {
    type: String,
    required: true,
    uppercase: true,
    maxlength: 5,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500,
  },
  profileIcon: {
    url: {
      type: String,
      default: null,
    },
    initials: {
      type: String,
      required: true,
      uppercase: true,
    },
    bgColor: {
      type: String,
      default: '#6366f1',
    },
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'observer'],
    default: 'member',
  },
  googleId: {
    type: String,
    sparse: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ googleId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate initials from full name
userSchema.methods.generateInitials = function(): string {
  return this.fullName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 5);
};

// Update initials when fullName changes
userSchema.pre('save', function(next) {
  if (this.isModified('fullName')) {
    const initials = this.fullName
      .split(' ')
      .map((name: string) => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 5);
    this.initials = initials;
    if (this.profileIcon) {
      this.profileIcon.initials = initials;
    }
  }
  next();
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);
