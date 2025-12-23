import mongoose, { Schema, Model } from 'mongoose';
import { ITag, ITagModel } from './types';

const tagSchema = new Schema<ITag>(
  {
    // 標籤名稱
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    // 標籤顏色
    color: {
      type: String,
      default: '#2196F3',
    },

    // 標籤描述
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // 擁有者
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 使用次數
    usageCount: {
      type: Number,
      default: 0,
    },

    // 是否為系統標籤
    isSystem: {
      type: Boolean,
      default: false,
    },
  }
);

// 索引
tagSchema.index({ user: 1 });

// 增加使用次數
tagSchema.methods.incrementUsage = function (): Promise<ITag> {
  this.usageCount += 1;
  return this.save();
};

// 減少使用次數
tagSchema.methods.decrementUsage = function (): Promise<ITag | undefined> {
  if (this.usageCount > 0) {
    this.usageCount -= 1;
    return this.save();
  }
  return Promise.resolve(undefined);
};

// 靜態方法：獲取熱門標籤
tagSchema.statics.getPopularTags = async function (
  limit: number = 10
): Promise<ITag[]> {
  return await this.find()
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('name color usageCount');
};

const Tag: Model<ITag> & ITagModel = mongoose.model<
  ITag,
  Model<ITag> & ITagModel
>('Tag', tagSchema);

export default Tag;
