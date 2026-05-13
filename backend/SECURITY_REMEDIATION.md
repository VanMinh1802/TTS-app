# Security Remediation Checklist

## Step 1: Remove .env from git history
```bash
# Install BFG Repo Cleaner (requires Java)
# Download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh mirror
git clone --mirror https://github.com/YOUR_REPO.git repo-mirror
cd repo-mirror

# Remove .env from all history
java -jar bfg.jar --delete-files .env

# Clean and push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

## Step 2: Rotate ALL secrets
- [ ] JWT_SECRET_KEY -> Render dashboard -> Environment -> Generate new 64-char key
- [ ] DATABASE_URL -> Neon dashboard -> Reset password -> Update on Render
- [ ] R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY -> Cloudflare dashboard -> R2 -> Manage API tokens -> Create new
- [ ] REDIS_PASSWORD -> Upstash dashboard -> Reset password -> Update on Render
- [ ] GOOGLE_CLIENT_ID -> Verify in Google Console (public, no rotation needed)

## Step 3: Verify
```bash
git log --all --diff-filter=A -- backend/.env
# Should return EMPTY
```
