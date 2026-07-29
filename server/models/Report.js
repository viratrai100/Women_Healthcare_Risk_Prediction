import mongoose from 'mongoose';

/**
 * Tracks generated PDF reports linked to a prediction.
 */
const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prediction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prediction',
      required: true,
    },
    title: {
      type: String,
      default: 'Risk Assessment Report',
    },
    // Storage path or URL if reports are saved to object storage
    filePath: {
      type: String,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
