type Env = {
  PORT: number;
  NODE_ENV: "development" | "production";
  DATABASE_URL: string;
  JWT_SECRET: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_API_KEY?: string;
  RESEND_API_KEY: string;
  PLATFORM_ADMIN_API_KEY: string;
  EMAIL_FROM?: string;
};

export default Env;
