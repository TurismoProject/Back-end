
export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
    PROVIDER_URL: process.env.PROVIDER_URL,
    HOST: process.env.HOST,
    PORT_EMAIL: parseInt(process.env.PORT_EMAIL, 10),
    USER_EMAIL: process.env.USER_EMAIL,
    PASS: process.env.PASS,
    EMAIL_DEFAULT: process.env.EMAIL_DEFAULT,
    // database: {
    //     host: process.env.DATABASE_HOST,
    //     port: parseInt(process.env.DATABASE_PORT, 10) || 5432
    // },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    }
});
