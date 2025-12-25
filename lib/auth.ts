import { betterAuth } from "better-auth";
import { pool } from "./db";

export const auth = betterAuth({
    database: pool,
    // We explicitly map the plural names at the top level.
    // This is the supported way to handle plural tables in v1.4.9.
    user: { modelName: "users" },
    session: { modelName: "sessions" },
    account: { modelName: "accounts" },
    verification: { modelName: "verifications" },

    emailAndPassword: {
        enabled: true,
    },
                   
                    
    secret: process.env.BETTER_AUTH_SECRET,
});