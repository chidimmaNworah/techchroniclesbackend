import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const verificationTokenSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true,
  },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now(), expires: 1800 },
});

// verificationTokenSchema.pre('save', async function (next) {
//   if (this.isModified('token')) {
//     const hash = await bcrypt.hash(this.token, 8);
//     this.token = hash;
//   }
//   next();
// });

// verificationTokenSchema.methods.compareToken = async function (token) {
//   const result = await bcrypt.compareSync(token, this.token);
//   return result;
// };

const VerificationToken = mongoose.model(
  'VerificationToken',
  verificationTokenSchema
);
export default VerificationToken;
