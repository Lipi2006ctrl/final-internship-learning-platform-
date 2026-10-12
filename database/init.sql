CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "user" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "role" VARCHAR(50) NOT NULL DEFAULT 'User', -- 'Admin' or 'User'
    "userName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255), -- Nullable for Google OAuth users
    "kingdomStatus" VARCHAR(50) DEFAULT 'Kingdom Beginner',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT FALSE
);

CREATE TABLE "domains" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT
);

CREATE TABLE "programmingLanguage" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL
);

CREATE TABLE "modules" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT,
    "difficultyLevel" VARCHAR(50)
);

CREATE TABLE "userDomain" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "user"("id") ON DELETE CASCADE,
    "domainId" UUID REFERENCES "domains"("id") ON DELETE CASCADE
);

CREATE TABLE "userProgrammingLanguage" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "user"("id") ON DELETE CASCADE,
    "languageId" UUID REFERENCES "programmingLanguage"("id") ON DELETE CASCADE
);

CREATE TABLE "questions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "text" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL, -- 'MCQ', 'Coding', 'Debugging'
    "options" JSONB,
    "correctAnswer" TEXT,
    "difficultyLevel" VARCHAR(50)
);

-- Seed Data for Domains
INSERT INTO "domains" ("name", "description") VALUES 
('Cyber Security', 'Learn to protect networks, systems, and programs from digital attacks.'),
('Web Development', 'Build interactive and dynamic websites and web applications.'),
('AI/ML', 'Explore Artificial Intelligence and Machine Learning techniques.'),
('Blockchain', 'Understand decentralized ledger technologies and cryptography.');

INSERT INTO "programmingLanguage" ("name") VALUES 
('C'),
('C++'),
('Java'),
('Python');

CREATE TABLE "otp_codes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "attempts" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isUsed" BOOLEAN DEFAULT FALSE
);
