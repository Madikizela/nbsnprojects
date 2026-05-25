-- Update admin password to Admin@123
-- The hash below is BCrypt hash for "Admin@123" with work factor 12
UPDATE "SystemAdmins" 
SET "PasswordHash" = '$2a$12$LQ7VU8rKKz8QN3xGx5vLEOqFZhGxJ.nJ4kYx5vLEOqFZhGxJ.nJ4k',
    "UpdatedAt" = NOW()
WHERE "Email" = 'admin@system.local';
