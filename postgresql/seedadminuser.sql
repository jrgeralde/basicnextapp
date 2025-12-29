-- 1. Insert the User (if they don't exist)
-- Note: 'id' is a string to satisfy Better Auth
-- 1. Insert admin user
INSERT INTO public.users (
    "id",
    "name",
    "email",
    "emailVerified",
    "active",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin-user-001',
    'System Administrator',
    'a@a.com',
     true,  -- email verified
    true,  -- active
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Account (linked to the user)
INSERT INTO public.accounts (
    id,
    "accountId",
    "providerId",
    "userId",
    "accessToken",
    "refreshToken",
    "idToken",
    "accessTokenExpiresAt",
    "refreshTokenExpiresAt",
    "scope",
    "password",
    "createdAt",
    "updatedAt"
) VALUES (
    'account-1',             -- id (TEXT)
    'admin-user-001',        -- accountId (must match userId for credential provider)
    'credential',           -- providerId (example for username/password)
    'admin-user-001',                -- userId (linked to users.id)
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '2d25f8f6aafb9b8a316d2e664ad072ca:eb7c75f07ee207af2dffe8e8a71f2423b98030ca028a36576257a300606182498fa33875a61a3335fdd6baf228ba0d07f75da2cda4136655c01a4b6e252ff918', -- password: password123 (scrypt/custom format)
    NOW(),
    NOW()
);

-- 3. Link the User to the EXISTING 'ADMINISTRATOR' role
-- We use the user's string ID and the existing role's string ID
INSERT INTO public.usersroles (
    "id",
    "userId", 
    "roleId"
) VALUES (
    'link-001',
    'admin-user-001', 
    'ADMINISTRATOR'
) ON CONFLICT DO NOTHING;