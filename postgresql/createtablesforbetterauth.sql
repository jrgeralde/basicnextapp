-- =========================================
-- DROP TABLES (dependency-safe order)
-- =========================================
DROP TABLE IF EXISTS public.usersroles CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.verifications CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =========================================
-- CREATE TABLES
-- =========================================

-- 1. Users Table (Better Auth expects TEXT IDs)
CREATE TABLE public.users (
    id TEXT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL,
    fullname VARCHAR(255),
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT, -- Added: Better Auth often expects an image field
    password TEXT,
    active BOOLEAN DEFAULT true,
    birthdate DATE,
    gender VARCHAR,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT users_name_unique UNIQUE (name)
);

-- 2. Sessions Table
CREATE TABLE public.sessions (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE -- Changed to TEXT and "userId" (camelCase)
);

-- 3. Accounts Table
CREATE TABLE public.accounts (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Changed to TEXT
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Verifications Table
CREATE TABLE public.verifications (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 5. Roles Table (Better for logic if Roles also use TEXT IDs)
-- The 'id' is now the name of the role (e.g., 'ADMINISTRATOR')
CREATE TABLE public.roles (
    id TEXT PRIMARY KEY, -- This acts as the Role Name
    description VARCHAR(200)
);

-- 6. UsersRoles Join Table
CREATE TABLE public.usersroles (
    id TEXT PRIMARY KEY, -- Changed to TEXT for consistency
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "roleId" TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE
);

-- =========================================
-- GRANTS
-- =========================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO reactuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO reactuser;