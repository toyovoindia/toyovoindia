import mongoose from 'mongoose';

const pageContentSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    enum: ['privacy-policy', 'terms-conditions', 'shipping-policy', 'return-policy', 'cancellation-policy', 'about-us', 'faq'],
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { 
  timestamps: true 
});

const PageContent = mongoose.model('PageContent', pageContentSchema);
export default PageContent;
