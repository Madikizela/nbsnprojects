const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5001; // Different port from the main backend
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'GQbHycf1uFOsWncLBQokFZD2yKJHlwl1MmxvxXkNx2I='; // Base64 encoded key matching frontend

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pgClient = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rlms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Connect to PostgreSQL
pgClient.connect().then(() => {
    console.log('✅ PostgreSQL proxy server connected to database');
}).catch(err => {
    console.error('❌ PostgreSQL connection failed:', err);
    process.exit(1);
});

// JWT Secret (should match backend)
const JWT_SECRET = process.env.JWT_SECRET || 'YourSuperSecretKeyThatIsAtLeast32CharactersLong!';

// Email Configuration - Gmail SMTP
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'madikizela21517799@gmail.com',
        pass: process.env.SMTP_PASS || 'quqeqfrygbypxoun'
    }
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'madikizela21517799@gmail.com';
const FROM_NAME = process.env.FROM_NAME || 'NBSN Team';

// Create email transporter with debug enabled
const transporter = nodemailer.createTransport(emailConfig);

// Enable debug output
transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ Email transporter verification error:', error);
    } else {
        console.log('✅ Email transporter is ready to send emails');
    }
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate secure password function
function generateSecurePassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + specialChars;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate welcome email HTML
function generateWelcomeEmailBody(clientName, username, password) {
    const loginUrl = process.env.VITE_API_URL
        ? process.env.VITE_API_URL.replace('/api', '').replace(':5213', ':5174')
        : 'http://localhost:5174';
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to NBSN</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #007bff;">Welcome to NBSN!</h2>
                
                <p>Dear ${clientName},</p>
                
                <p>Your account has been successfully created. Below are your login credentials:</p>
                
                <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Username / Email:</strong> ${username}</p>
                    <p><strong>Password:</strong> <code style="background:#fff;padding:4px 8px;border:1px dashed #007bff;font-size:16px;color:#007bff">${password}</code></p>
                    <p><strong>Login URL:</strong> <a href="${loginUrl}/login">${loginUrl}/login</a></p>
                </div>
                
                <p style="color: #dc3545;"><strong>Please change your password after your first login.</strong></p>
                
                <p>Best regards,<br><strong>NBSN Team</strong></p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </body>
        </html>
    `;
}

// Send welcome email function
async function sendWelcomeEmail(clientEmail, clientName, username, password) {
    if (!isValidEmail(clientEmail)) {
        console.log(`❌ Invalid email address: ${clientEmail}`);
        return false;
    }

    const subject = 'Welcome to Learning Management System - Your Account Details';
    const body = generateWelcomeEmailBody(clientName, username, password);

    const mailOptions = {
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: clientEmail,
        subject: subject,
        html: body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${clientEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send welcome email to ${clientEmail}:`, error);
        return false;
    }
}

// Encryption/Decryption functions
function encrypt(text) {
    if (!text) return null;
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(encryptedText) {
    if (!encryptedText) return null;
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// New AES-CBC decryption function to match frontend encryption
function decryptAESCBC(encryptedData) {
    try {
        // Convert base64 key to buffer
        const key = Buffer.from(ENCRYPTION_KEY, 'base64');
        
        // Parse the base64 encrypted data
        const combined = Buffer.from(encryptedData, 'base64');
        
        // Extract IV (first 16 bytes) and ciphertext
        const iv = combined.slice(0, 16);
        const ciphertext = combined.slice(16);
        
        // Decrypt
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(ciphertext, null, 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('AES-CBC decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // First check SystemAdmins table
        const adminQuery = `
            SELECT "Id", "Email", "PasswordHash", "FirstName", "LastName", 'SystemAdmin' as "UserType"
            FROM "SystemAdmins" 
            WHERE "Email" = $1 AND "Status" = 0
        `;
        
        const adminResult = await client.query(adminQuery, [email]);
        
        if (adminResult.rows.length > 0) {
            const admin = adminResult.rows[0];
            const isPasswordValid = await bcrypt.compare(password, admin.PasswordHash);
            
            if (isPasswordValid) {
                const token = jwt.sign(
                    { 
                        id: admin.Id, 
                        email: admin.Email, 
                        userType: 'SystemAdmin',
                        firstName: admin.FirstName,
                        lastName: admin.LastName
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log(`✅ SystemAdmin login successful: ${email}`);
                return res.json({
                    token,
                    user: {
                        id: admin.Id,
                        email: admin.Email,
                        firstName: admin.FirstName,
                        lastName: admin.LastName,
                        userType: 'SystemAdmin'
                    }
                });
            }
        }

        // Then check Users table for SDP users (Role = 1 for SDP users)
        const sdpUserQuery = `
            SELECT u."Id", u."Email", u."PasswordHash", u."FirstName", u."LastName", 
                   u."SkillsDevelopmentProviderId", 'SDPUser' as "UserType", u."Role"
            FROM "Users" u
            WHERE u."Email" = $1 AND u."Status" = 0 AND u."Role" = 1
        `;
        
        const sdpUserResult = await client.query(sdpUserQuery, [email]);
        
        if (sdpUserResult.rows.length > 0) {
            const sdpUser = sdpUserResult.rows[0];
            const isPasswordValid = await bcrypt.compare(password, sdpUser.PasswordHash);
            
            if (isPasswordValid) {
                const token = jwt.sign(
                    { 
                        id: sdpUser.Id, 
                        email: sdpUser.Email, 
                        userType: 'SDPUser',
                        firstName: sdpUser.FirstName,
                        lastName: sdpUser.LastName,
                        skillsDevelopmentProviderId: sdpUser.SkillsDevelopmentProviderId,
                        role: sdpUser.Role
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log(`✅ SDP User login successful: ${email}`);
                return res.json({
                    token,
                    user: {
                        id: sdpUser.Id,
                        email: sdpUser.Email,
                        firstName: sdpUser.FirstName,
                        lastName: sdpUser.LastName,
                        userType: 'SDPUser',
                        skillsDevelopmentProviderId: sdpUser.SkillsDevelopmentProviderId,
                        role: sdpUser.Role
                    }
                });
            }
        }

        // Then check Users table for Client users (Role = 2)
        const clientUserQuery = `
            SELECT u."Id", u."Email", u."PasswordHash", u."FirstName", u."LastName", 
                   u."ClientId", 'ClientUser' as "UserType", u."Role"
            FROM "Users" u
            WHERE u."Email" = $1 AND u."Status" = 0 AND u."Role" = 2
        `;
        
        const clientUserResult = await client.query(clientUserQuery, [email]);
        
        if (clientUserResult.rows.length > 0) {
            const clientUser = clientUserResult.rows[0];
            const isPasswordValid = await bcrypt.compare(password, clientUser.PasswordHash);
            
            if (isPasswordValid) {
                const token = jwt.sign(
                    { 
                        id: clientUser.Id, 
                        email: clientUser.Email, 
                        userType: 'ClientUser',
                        firstName: clientUser.FirstName,
                        lastName: clientUser.LastName,
                        clientId: clientUser.ClientId,
                        role: clientUser.Role
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log(`✅ Client User login successful: ${email}`);
                return res.json({
                    token,
                    user: {
                        id: clientUser.Id,
                        email: clientUser.Email,
                        firstName: clientUser.FirstName,
                        lastName: clientUser.LastName,
                        userType: 'ClientUser',
                        clientId: clientUser.ClientId,
                        role: clientUser.Role
                    }
                });
            }
        }

        // Finally check Users table for department users (Role = 3 and higher)
        const userQuery = `
            SELECT "Id", "Email", "PasswordHash", "FirstName", "LastName", "Role", 
                   "ClientId", "SkillsDevelopmentProviderId", "DepartmentId", 'DepartmentUser' as "UserType"
            FROM "Users" 
            WHERE "Email" = $1 AND "Status" = 0 AND "Role" >= 3
        `;
        
        const userResult = await client.query(userQuery, [email]);
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
            
            if (isPasswordValid) {
                const token = jwt.sign(
                    { 
                        id: user.Id, 
                        email: user.Email, 
                        userType: 'DepartmentUser',
                        firstName: user.FirstName,
                        lastName: user.LastName,
                        role: user.Role,
                        clientId: user.ClientId,
                        skillsDevelopmentProviderId: user.SkillsDevelopmentProviderId,
                        departmentId: user.DepartmentId
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log(`✅ Department User login successful: ${email}`);
                return res.json({
                    token,
                    user: {
                        id: user.Id,
                        email: user.Email,
                        firstName: user.FirstName,
                        lastName: user.LastName,
                        userType: 'DepartmentUser',
                        role: user.Role,
                        clientId: user.ClientId,
                        skillsDevelopmentProviderId: user.SkillsDevelopmentProviderId,
                        departmentId: user.DepartmentId
                    }
                });
            }
        }

        console.log(`❌ Login failed for: ${email}`);
        res.status(401).json({ message: 'Invalid email or password' });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    } finally {
        client.release();
    }
});

// Password reset request endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user exists in any table
        let userExists = false;
        let userTable = '';

        // Check SystemAdmins
        const adminResult = await client.query('SELECT "Id" FROM "SystemAdmins" WHERE "Email" = $1', [email]);
        if (adminResult.rows.length > 0) {
            userExists = true;
            userTable = 'SystemAdmins';
        }

        // Check SDPAdmins if not found in SystemAdmins
        if (!userExists) {
            const sdpAdminResult = await client.query('SELECT "Id" FROM "SDPAdmins" WHERE "Email" = $1', [email]);
            if (sdpAdminResult.rows.length > 0) {
                userExists = true;
                userTable = 'SDPAdmins';
            }
        }

        // Check Users if not found in other tables
        if (!userExists) {
            const userResult = await client.query('SELECT "Id" FROM "Users" WHERE "Email" = $1', [email]);
            if (userResult.rows.length > 0) {
                userExists = true;
                userTable = 'Users';
            }
        }

        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Store reset token (you might want to create a separate table for this)
        const resetLink = `http://localhost:5174/reset-password?token=${resetToken}`;
        
        // For now, just log the reset link
        console.log(`🔑 Password reset requested for ${email}`);
        console.log(`🔗 Reset link: ${resetLink}`);
        
        res.json({ message: 'Password reset link has been sent to your email' });

    } catch (error) {
        console.error('❌ Password reset request error:', error);
        res.status(500).json({ message: 'An error occurred while processing password reset request' });
    } finally {
        client.release();
    }
});

// Password reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        // In a real implementation, you would:
        // 1. Verify the token exists and hasn't expired
        // 2. Find the associated user
        // 3. Update their password
        // 4. Invalidate the reset token

        // For now, just return success
        console.log(`🔑 Password reset completed for token: ${token}`);
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        res.json({ message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('❌ Password reset error:', error);
        res.status(500).json({ message: 'An error occurred while resetting password' });
    } finally {
        client.release();
    }
});

// GET: api/projects
app.get('/api/projects', authenticateToken, async (req, res) => {
    const client = await pgClient.connect();
    try {
        const result = await client.query(`
            SELECT "Id", "Name", "Description", "Status", "CreatedAt", "UpdatedAt"
            FROM "Projects"
            ORDER BY "Name"
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        res.status(500).json({ message: 'Failed to fetch projects' });
    } finally {
        client.release();
    }
});

// POST: api/projects
app.post('/api/projects', authenticateToken, async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const result = await client.query(`
            INSERT INTO "Projects" ("Name", "Description", "Status", "CreatedAt", "UpdatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING "Id", "Name", "CreatedAt"
        `, [name, description || null, 0]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error creating project:', error);
        res.status(500).json({ message: 'Failed to create project' });
    } finally {
        client.release();
    }
});

// POST: api/clients/register
app.post('/api/clients/register', async (req, res) => {
    const client = await pgClient.connect();
    try {
        // Handle both encrypted and direct data formats
        let clientData;
        
        if (req.body.encryptedClientData) {
            // Handle encrypted data using proper AES-CBC decryption
            try {
                clientData = decryptAESCBC(req.body.encryptedClientData);
                console.log('Successfully decrypted client data:', clientData);
            } catch (error) {
                console.error('Decryption failed:', error);
                return res.status(400).json({ message: 'Invalid encrypted data format' });
            }
        } else {
            // Handle direct data (from frontend)
            clientData = req.body;
        }

        // Extract fields with fallbacks for different naming conventions
        const companyName = clientData.name || clientData.companyName;
        const contactPersonEmail = clientData.email || clientData.contactPersonEmail;
        const contactPersonPhone = clientData.phoneNumber || clientData.contactPersonPhone;
        const address = clientData.address;
        const description = clientData.description;
        const contactPerson = clientData.contactPerson;

        // Parse contact person name if provided as single field
        let contactPersonFirstName = clientData.contactPersonFirstName || '';
        let contactPersonLastName = clientData.contactPersonLastName || '';
        
        if (!contactPersonFirstName && !contactPersonLastName && contactPerson) {
            const nameParts = contactPerson.trim().split(' ');
            contactPersonFirstName = nameParts[0] || '';
            contactPersonLastName = nameParts.slice(1).join(' ') || '';
        }

        // Basic validation - only require essential fields
        if (!companyName || !contactPersonEmail) {
            return res.status(400).json({ message: 'Company name and email are required' });
        }

        // Check if client email already exists
        const existingClient = await client.query(`
            SELECT "Id" FROM "Clients" WHERE "Email" = $1
        `, [contactPersonEmail]);
        
        if (existingClient.rows.length > 0) {
            return res.status(400).json({ message: 'A client with this email already exists' });
        }

        await client.query('BEGIN');

        // Generate admin password
        const adminPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Insert client using existing table structure
        const clientResult = await client.query(`
            INSERT INTO "Clients" (
                "Name", "Description", "Address", "PhoneNumber", "Email", 
                "ContactPerson", "Status", "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING "Id", "Name", "CreatedAt"
        `, [
            companyName,
            clientData.description || 'No description provided',
            address || null,
            contactPersonPhone || null,
            contactPersonEmail,
            contactPerson || 'Unknown',
            0 // Active status
        ]);

        const newClient = clientResult.rows[0];

        // Ensure Users table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Users" (
                "Id" SERIAL PRIMARY KEY,
                "FirstName" VARCHAR(100) NOT NULL,
                "LastName" VARCHAR(100) NOT NULL,
                "Username" VARCHAR(255) NOT NULL UNIQUE,
                "Email" VARCHAR(255) NOT NULL UNIQUE,
                "PasswordHash" VARCHAR(255) NOT NULL,
                "Role" INTEGER NOT NULL,
                "Status" INTEGER NOT NULL DEFAULT 0,
                "ClientId" INTEGER,
                "SkillsDevelopmentProviderId" INTEGER,
                "DepartmentId" INTEGER,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        // Create admin user for the client
        const username = contactPersonEmail; // Use email as username
        await client.query(`
            INSERT INTO "Users" (
                "FirstName", "LastName", "Username", "Email", "PasswordHash",
                "Role", "Status", "ClientId", "SkillsDevelopmentProviderId",
                "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [
            contactPersonFirstName,
            contactPersonLastName,
            username,
            contactPersonEmail,
            hashedPassword,
            1, // ClientAdmin role
            0, // Active status
            newClient.Id,
            skillsDevelopmentProviderId
        ]);

        // Send welcome email with credentials
        try {
            const emailSent = await sendWelcomeEmail(
                contactPersonEmail,
                `${contactPersonFirstName} ${contactPersonLastName}`,
                username,
                adminPassword
            );

            if (!emailSent) {
                console.log(`⚠️ Failed to send welcome email to ${contactPersonEmail} for client ${companyName}`);
            }

            console.log(`✅ Client admin account created for ${contactPersonEmail} with password: ${adminPassword}`);
        } catch (emailError) {
            console.error('❌ Error sending welcome email:', emailError);
        }

        await client.query('COMMIT');
        res.status(201).json(newClient);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error registering client:', error);
        res.status(500).json({ message: 'An error occurred while registering the client' });
    } finally {
        client.release();
    }
});

// POST: api/sdp/register
app.post('/api/sdp/register', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const {
            providerName,
            accreditationNumber,
            contactPersonFirstName,
            contactPersonLastName,
            contactPersonEmail,
            contactPersonPhone,
            address,
            city,
            province,
            postalCode
        } = req.body;

        // Basic validation
        if (!providerName || !accreditationNumber || !contactPersonFirstName || !contactPersonLastName || !contactPersonEmail) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        // Check if SDP email already exists
        const existingSDP = await client.query(`
            SELECT "Id" FROM "SkillsDevelopmentProviders" WHERE "ContactPersonEmail" = $1
        `, [contactPersonEmail]);
        
        if (existingSDP.rows.length > 0) {
            return res.status(400).json({ message: 'An SDP with this email already exists' });
        }

        // Check if accreditation number already exists
        const existingAccreditation = await client.query(`
            SELECT "Id" FROM "SkillsDevelopmentProviders" WHERE "AccreditationNumber" = $1
        `, [accreditationNumber]);
        
        if (existingAccreditation.rows.length > 0) {
            return res.status(400).json({ message: 'An SDP with this accreditation number already exists' });
        }

        // Ensure SkillsDevelopmentProviders table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS "SkillsDevelopmentProviders" (
                "Id" SERIAL PRIMARY KEY,
                "ProviderName" VARCHAR(255) NOT NULL,
                "AccreditationNumber" VARCHAR(100) NOT NULL UNIQUE,
                "ContactPersonFirstName" VARCHAR(100) NOT NULL,
                "ContactPersonLastName" VARCHAR(100) NOT NULL,
                "ContactPersonEmail" VARCHAR(255) NOT NULL UNIQUE,
                "ContactPersonPhone" VARCHAR(20),
                "Address" TEXT,
                "City" VARCHAR(100),
                "Province" VARCHAR(100),
                "PostalCode" VARCHAR(20),
                "Status" INTEGER NOT NULL DEFAULT 0,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        await client.query('BEGIN');

        // Generate admin password
        const generatedPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const passwordHash = await bcrypt.hash(generatedPassword, 12);

        // Insert SDP
        const sdpResult = await client.query(`
            INSERT INTO "SkillsDevelopmentProviders" (
                "ProviderName", "AccreditationNumber", "ContactPersonFirstName", 
                "ContactPersonLastName", "ContactPersonEmail", "ContactPersonPhone", 
                "Address", "City", "Province", "PostalCode", "Status", 
                "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING "Id", "ProviderName", "CreatedAt"
        `, [
            providerName,
            accreditationNumber,
            contactPersonFirstName,
            contactPersonLastName,
            contactPersonEmail,
            contactPersonPhone || null,
            address || null,
            city || null,
            province || null,
            postalCode || null,
            0 // Active status
        ]);

        const newSDP = sdpResult.rows[0];

        // Ensure SDPAdmins table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS "SDPAdmins" (
                "Id" SERIAL PRIMARY KEY,
                "FirstName" VARCHAR(100) NOT NULL,
                "LastName" VARCHAR(100) NOT NULL,
                "Email" VARCHAR(255) NOT NULL UNIQUE,
                "PasswordHash" VARCHAR(255) NOT NULL,
                "Status" INTEGER NOT NULL DEFAULT 0,
                "SkillsDevelopmentProviderId" INTEGER NOT NULL,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        // Create admin user for the SDP
        await client.query(`
            INSERT INTO "SDPAdmins" (
                "FirstName", "LastName", "Email", "PasswordHash", "Status", 
                "SkillsDevelopmentProviderId", "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
            contactPersonFirstName,
            contactPersonLastName,
            contactPersonEmail,
            passwordHash,
            0, // Active status
            newSDP.Id
        ]);

        // Send welcome email with credentials
        try {
            const emailSent = await sendWelcomeEmail(
                contactPersonEmail,
                `${contactPersonFirstName} ${contactPersonLastName}`,
                contactPersonEmail, // Use email as username
                generatedPassword
            );

            if (!emailSent) {
                console.log(`⚠️ Failed to send welcome email to ${contactPersonEmail} for SDP ${providerName}`);
            }

            console.log(`✅ SDP admin account created for ${contactPersonEmail} with password: ${generatedPassword}`);
        } catch (emailError) {
            console.error('❌ Error sending welcome email:', emailError);
        }

        await client.query('COMMIT');
        res.status(201).json(newSDP);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error registering SDP:', error);
        res.status(500).json({ message: 'An error occurred while registering the SDP' });
    } finally {
        client.release();
    }
});

// GET: api/Departments
app.get('/api/Departments', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const result = await client.query(`
            SELECT "Id", "Name", "Description", "Type", "Status", "ManagerFirstName", 
                   "ManagerSurname", "ManagerEmail", "SkillsDevelopmentProviderId", 
                   "CreatedAt", "UpdatedAt"
            FROM "Departments"
            ORDER BY "Name"
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching departments:', error);
        res.status(500).json({ message: 'Failed to fetch departments' });
    } finally {
        client.release();
    }
});

// GET: api/Departments/{id}
app.get('/api/Departments/:id', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { id } = req.params;
        const result = await client.query(`
            SELECT "Id", "Name", "Description", "Type", "Status", "ManagerFirstName", 
                   "ManagerSurname", "ManagerEmail", "SkillsDevelopmentProviderId", 
                   "CreatedAt", "UpdatedAt"
            FROM "Departments"
            WHERE "Id" = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error fetching department:', error);
        res.status(500).json({ message: 'Failed to fetch department' });
    } finally {
        client.release();
    }
});

// GET: api/Departments/BySDP/{sdpId}
app.get('/api/Departments/BySDP/:sdpId', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { sdpId } = req.params;
        const result = await client.query(`
            SELECT "Id", "Name", "Description", "Type", "Status", "ManagerFirstName", 
                   "ManagerSurname", "ManagerEmail", "SkillsDevelopmentProviderId", 
                   "CreatedAt", "UpdatedAt"
            FROM "Departments"
            WHERE "SkillsDevelopmentProviderId" = $1
            ORDER BY "Name"
        `, [sdpId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching departments by SDP:', error);
        res.status(500).json({ message: 'Failed to fetch departments' });
    } finally {
        client.release();
    }
});

// POST: api/Departments
app.post('/api/Departments', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const {
            name,
            description,
            type,
            managerFirstName,
            managerSurname,
            managerEmail,
            skillsDevelopmentProviderId
        } = req.body;

        // Basic validation
        if (!name || !skillsDevelopmentProviderId) {
            return res.status(400).json({ message: 'Name and SkillsDevelopmentProviderId are required' });
        }

        // Check if manager email already exists
        if (managerEmail) {
            const existingUser = await client.query(`
                SELECT "Id" FROM "Users" WHERE "Email" = $1
            `, [managerEmail]);
            
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ message: 'A user with this email already exists' });
            }
        }

        // Ensure Departments table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Departments" (
                "Id" SERIAL PRIMARY KEY,
                "Name" VARCHAR(255) NOT NULL,
                "Description" TEXT,
                "Type" INTEGER NOT NULL DEFAULT 0,
                "Status" INTEGER NOT NULL DEFAULT 0,
                "ManagerFirstName" VARCHAR(100),
                "ManagerSurname" VARCHAR(100),
                "ManagerEmail" VARCHAR(255),
                "SkillsDevelopmentProviderId" INTEGER NOT NULL,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        await client.query('BEGIN');

        // Insert department
        const departmentResult = await client.query(`
            INSERT INTO "Departments" (
                "Name", "Description", "Type", "Status", "ManagerFirstName", 
                "ManagerSurname", "ManagerEmail", "SkillsDevelopmentProviderId", 
                "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING "Id", "Name", "CreatedAt"
        `, [
            name,
            description || null,
            type || 0,
            0, // Active status
            managerFirstName || null,
            managerSurname || null,
            managerEmail || null,
            skillsDevelopmentProviderId
        ]);

        const department = departmentResult.rows[0];

        // Create user account for department manager if manager details are provided
        if (managerEmail && managerFirstName && managerSurname) {
            // Generate credentials
            const username = managerEmail; // Use email as username
            const password = generateSecurePassword();
            const hashedPassword = await bcrypt.hash(password, 10);

            // Determine user role based on department type
            let userRole = 4; // SDPAdministrator
            switch (parseInt(type)) {
                case 1: userRole = 4; break; // AdministratorManager -> SDPAdministrator
                case 2: userRole = 5; break; // LogisticManager -> SDPLogistics
                case 3: userRole = 6; break; // FinancialManager -> SDPFinance
                case 4: userRole = 7; break; // QualityAssuranceManager -> SDPAssessor
                case 5: userRole = 8; break; // ITManager -> SDPIT
                default: userRole = 4; break;
            }

            // Ensure Users table exists
            await client.query(`
                CREATE TABLE IF NOT EXISTS "Users" (
                    "Id" SERIAL PRIMARY KEY,
                    "FirstName" VARCHAR(100) NOT NULL,
                    "LastName" VARCHAR(100) NOT NULL,
                    "Username" VARCHAR(255) NOT NULL UNIQUE,
                    "Email" VARCHAR(255) NOT NULL UNIQUE,
                    "PasswordHash" VARCHAR(255) NOT NULL,
                    "Role" INTEGER NOT NULL,
                    "Status" INTEGER NOT NULL DEFAULT 0,
                    "ClientId" INTEGER,
                    "SkillsDevelopmentProviderId" INTEGER,
                    "DepartmentId" INTEGER,
                    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
                    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
                );
            `);

            // Create user account
            await client.query(`
                INSERT INTO "Users" (
                    "FirstName", "LastName", "Username", "Email", "PasswordHash",
                    "Role", "Status", "SkillsDevelopmentProviderId", "DepartmentId",
                    "CreatedAt", "UpdatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            `, [
                managerFirstName,
                managerSurname,
                username,
                managerEmail,
                hashedPassword,
                userRole,
                0, // Active status
                skillsDevelopmentProviderId,
                department.Id
            ]);

            // Send welcome email with credentials
            try {
                const emailSent = await sendWelcomeEmail(
                    managerEmail,
                    `${managerFirstName} ${managerSurname}`,
                    username,
                    password
                );

                if (!emailSent) {
                    console.log(`⚠️ Failed to send welcome email to ${managerEmail} for department ${name}`);
                }

                console.log(`✅ Department manager account created for ${managerEmail} with role ${userRole}`);
            } catch (emailError) {
                console.error('❌ Error sending welcome email:', emailError);
            }
        }

        await client.query('COMMIT');
        res.status(201).json(department);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating department:', error);
        res.status(500).json({ message: 'An error occurred while creating the department' });
    } finally {
        client.release();
    }
});

// PUT: api/Departments/{id}
app.put('/api/Departments/:id', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { id } = req.params;
        const {
            name,
            description,
            type,
            status,
            managerFirstName,
            managerSurname,
            managerEmail
        } = req.body;

        const result = await client.query(`
            UPDATE "Departments" 
            SET "Name" = $1, "Description" = $2, "Type" = $3, "Status" = $4,
                "ManagerFirstName" = $5, "ManagerSurname" = $6, "ManagerEmail" = $7,
                "UpdatedAt" = NOW()
            WHERE "Id" = $8
            RETURNING "Id", "Name", "UpdatedAt"
        `, [
            name,
            description,
            type,
            status,
            managerFirstName,
            managerSurname,
            managerEmail,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error updating department:', error);
        res.status(500).json({ message: 'Failed to update department' });
    } finally {
        client.release();
    }
});

// DELETE: api/Departments/{id}
app.delete('/api/Departments/:id', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Get the department's manager email before deleting
        const deptResult = await client.query(`
            SELECT "ManagerEmail" FROM "Departments" WHERE "Id" = $1
        `, [id]);

        if (deptResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Department not found' });
        }

        const managerEmail = deptResult.rows[0].ManagerEmail;

        // Delete the associated manager user account if it exists
        if (managerEmail) {
            await client.query(`
                DELETE FROM "Users" WHERE "Email" = $1 AND "DepartmentId" = $2
            `, [managerEmail, id]);
        }

        // Delete the department
        await client.query(`DELETE FROM "Departments" WHERE "Id" = $1`, [id]);

        await client.query('COMMIT');
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error deleting department:', error);
        res.status(500).json({ message: 'Failed to delete department' });
    } finally {
        client.release();
    }
});

// POST: api/Departments/{id}/resend-credentials
app.post('/api/Departments/:id/resend-credentials', async (req, res) => {
    const client = await pgClient.connect();
    try {
        const deptId = parseInt(req.params.id);

        const deptResult = await client.query(`
            SELECT "Id", "Name", "ManagerEmail", "ManagerFirstName", "ManagerSurname"
            FROM "Departments" WHERE "Id" = $1
        `, [deptId]);

        if (deptResult.rows.length === 0)
            return res.status(404).json({ message: 'Department not found' });

        const dept = deptResult.rows[0];

        if (!dept.ManagerEmail)
            return res.status(400).json({ message: 'No manager email on record for this department' });

        const userResult = await client.query(`
            SELECT "Id", "Username", "Email"
            FROM "Users" WHERE "Email" = $1 AND "DepartmentId" = $2
        `, [dept.ManagerEmail, deptId]);

        if (userResult.rows.length === 0)
            return res.status(404).json({ message: 'No user account found for this department manager' });

        const user = userResult.rows[0];
        const newPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await client.query(`
            UPDATE "Users" SET "PasswordHash" = $1, "UpdatedAt" = NOW() WHERE "Id" = $2
        `, [hashedPassword, user.Id]);

        const emailSent = await sendWelcomeEmail(
            user.Email,
            `${dept.ManagerFirstName} ${dept.ManagerSurname}`,
            user.Username || user.Email,
            newPassword
        );

        if (emailSent) {
            return res.json({ message: `Credentials resent to ${user.Email}`, emailSent: true });
        } else {
            return res.json({
                message: 'Password reset but email could not be sent. Save these credentials:',
                emailSent: false,
                adminUsername: user.Username || user.Email,
                temporaryPassword: newPassword
            });
        }
    } catch (error) {
        console.error('❌ Error resending credentials:', error);
        res.status(500).json({ message: 'An error occurred' });
    } finally {
        client.release();
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'PostgreSQL Proxy Server' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PostgreSQL Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Login endpoint: http://localhost:${PORT}/api/auth/login`);
    // Log registered routes to help diagnose routing
    try {
        const routes = [];
        if (app && app._router && app._router.stack) {
            app._router.stack.forEach(middleware => {
                if (middleware.route) {
                    const route = middleware.route;
                    const methods = Object.keys(route.methods).map(m => m.toUpperCase()).join(',');
                    routes.push(`${methods} ${route.path}`);
                } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
                    middleware.handle.stack.forEach(handler => {
                        const route = handler.route;
                        if (route) {
                            const methods = Object.keys(route.methods).map(m => m.toUpperCase()).join(',');
                            routes.push(`${methods} ${route.path}`);
                        }
                    });
                }
            });
        }
        console.log('🛣️ Registered routes:', routes);
    } catch (e) {
        console.log('⚠️ Could not list routes:', e?.message || e);
    }
});

// Graceful shutdown
let isShuttingDown = false;
process.on('SIGINT', async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log('\n🛑 Shutting down PostgreSQL proxy server...');
    try {
        await pgClient.end();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
    process.exit(0);
});