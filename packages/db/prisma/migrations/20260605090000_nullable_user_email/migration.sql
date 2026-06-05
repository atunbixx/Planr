-- Allow email-less auth users (anonymous/phone). NULLs are distinct in a unique index.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
