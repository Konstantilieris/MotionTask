import Pusher from "pusher";

// Pusher configuration for real-time notifications
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "us2",
  useTLS: true,
});

// Client-side configuration (for frontend)
export const pusherConfig = {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
  forceTLS: true,
};
