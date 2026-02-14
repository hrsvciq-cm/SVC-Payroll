# Fix for Error 42P05: "prepared statement already exists"

## Problem
You're getting this error in Vercel:
```
ConnectorError(PostgresError { 
  code: "42P05", 
  message: "prepared statement \"s0\" already exists" 
})
```

This happens because Prisma is trying to use prepared statements through Supabase's PgBouncer connection pooler, which doesn't support prepared statements in transaction mode.

## Solution

### Step 1: Update Vercel Environment Variables

Go to your Vercel Dashboard:
1. Navigate to: https://vercel.com/dashboard
2. Select your project: `svc-payroll`
3. Go to **Settings** > **Environment Variables**

### Step 2: Set DATABASE_URL (for Production/Connection Pooling)

**For Production (port 6543 - Transaction mode with PgBouncer):**

```
postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Important Notes:**
- ✅ Port **6543** (Transaction mode - required for PgBouncer)
- ✅ Must include `?pgbouncer=true` (tells Prisma to disable prepared statements)
- ✅ Must include `&connection_limit=1` (prevents multiple connections)
- ✅ Apply to: **Production, Preview, Development** (all environments)

**If your password contains special characters, URL-encode them:**
```
postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Step 3: Set DIRECT_URL (for Migrations)

**For Migrations (port 5432 - Session mode, direct connection):**

```
postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

**Important Notes:**
- ✅ Port **5432** (Session mode - direct connection, supports prepared statements)
- ✅ No `?pgbouncer=true` (direct connection doesn't need it)
- ✅ Used only for migrations (`prisma migrate`, `prisma db push`)
- ✅ Apply to: **Production, Preview, Development** (all environments)

**If your password contains special characters, URL-encode them:**
```
postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

### Step 4: Verify Environment Variables

After adding/updating the variables:

1. ✅ Check that both `DATABASE_URL` and `DIRECT_URL` are set
2. ✅ Check that `DATABASE_URL` includes `?pgbouncer=true&connection_limit=1`
3. ✅ Check that `DIRECT_URL` uses port 5432 (no pgbouncer parameter)
4. ✅ Check that both are applied to all environments (Production, Preview, Development)

### Step 5: Redeploy

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

## How It Works

### For Production (Vercel):
- **DATABASE_URL** (port 6543):
  - Uses PgBouncer connection pooling (transaction mode)
  - `?pgbouncer=true` tells Prisma to disable prepared statements
  - `&connection_limit=1` prevents multiple connections that cause conflicts
  - This prevents error 42P05 ("prepared statement already exists")

### For Migrations:
- **DIRECT_URL** (port 5432):
  - Direct connection to PostgreSQL (session mode)
  - Supports prepared statements
  - Used only for `prisma migrate` and `prisma db push`
  - Not used for regular queries (those use DATABASE_URL)

### For Local Development:
- The code automatically uses `DIRECT_URL` if available
- This allows prepared statements to work locally
- No need to change `.env.local` (keep it as is)

## Code Changes Applied

### 1. `prisma/schema.prisma` ✅
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. `lib/prisma.js` ✅
- Automatically adds `?pgbouncer=true&connection_limit=1` to DATABASE_URL in production
- Uses DIRECT_URL for local development
- Singleton pattern prevents multiple PrismaClient instances

## Testing

After redeploying:

1. ✅ Check Vercel logs - no more error 42P05
2. ✅ Dashboard loads without errors
3. ✅ Data appears correctly
4. ✅ No "prepared statement" errors in logs

## Troubleshooting

### Still getting error 42P05?
1. **Check Vercel Environment Variables:**
   - Ensure `DATABASE_URL` has `?pgbouncer=true&connection_limit=1`
   - Ensure both variables are set for all environments
   - Check for typos or extra spaces

2. **Redeploy:**
   - Environment variables changes require a new deployment
   - Go to Deployments > Redeploy

3. **Check Logs:**
   - Look for the actual connection string being used
   - Verify it includes `pgbouncer=true`

### Connection errors?
1. **Check password encoding:**
   - Special characters must be URL-encoded
   - `@` → `%40`, `?` → `%3F`, `%` → `%25`

2. **Check Supabase connection string:**
   - Get fresh connection strings from Supabase Dashboard
   - Settings > Database > Connection string

## Summary

✅ **DATABASE_URL**: `postgresql://...:6543/...?pgbouncer=true&connection_limit=1`
✅ **DIRECT_URL**: `postgresql://...:5432/...` (no pgbouncer parameter)
✅ **Redeploy** after updating environment variables
✅ **Error 42P05** should be resolved

