import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const key_id = process.env.RAZORPAY_API_KEY!;
const key_secret = process.env.RAZORPAY_API_SECRETS!;

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});
