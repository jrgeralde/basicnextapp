-- 1. Insert the User (if they don't exist)
-- Note: 'id' is a string to satisfy Better Auth
-- 1. Insert admin user
INSERT INTO public.users (
    "id",
    "name",
    "email",
    "password",
    "emailVerified",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin-user-001',
    'System Administrator',
    'admin@test.com',
    '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Qy5p0q7n0qQX4vJ0vYqjQ6kR9FZy2',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. Link the User to the EXISTING 'ADMINISTRATOR' role
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