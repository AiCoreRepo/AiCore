# Prisma Migration Sync Guide: Development → Production

**Context:** The migration history has been "baselined". 37 old migrations were replaced by a single `0001_init` migration, followed by 10 new feature migrations (`0002` to `0011`).

Because the Production database already applied the 27 old migrations natively, it will fail to deploy the new history unless we manually intervene to synchronize the tracking tables. 

---

## 🚨 The Pre-Deployment Reality
If you simply merge these changes into `dev` and your CI/CD pipeline runs `npx prisma migrate deploy` automatically, **the deployment will completely fail** on the first try. 

This is expected! The pipeline tries to run `0001_init`, sees the tables already exist, and crashes.

---

## 🛠️ Step-by-Step Solution 

### Step 1: Merge the Code
Merge your feature branch into the `dev` branch via GitHub/GitLab.

### Step 2: Let the Initial Deploy Fail
Let the CI/CD pipeline trigger automatically. It will run and eventually output an error saying the migration failed because relation tables already exist. **Do not panic; your data is safe.**

### Step 3: SSH into your GCP Environment
Connect to the server where the backend runs.
* If using Compute Engine: SSH into the VM.
* If using Cloud Run: Use the "Cloud Shell" or the Exec tab on the container.
* If using GKE: `kubectl exec -it <pod_name> -- /bin/bash`

Navigate to the directory containing your backend code (where the `prisma` folder and `.env` file are located).

### Step 4: Clear Old Migration History
You must clear out the old mess of history so Prisma sees a blank slate for its tracking. Run this SQL command against your production database (you can do this via your preferred DB client like pgAdmin, or directly in the SSH console using `psql` if installed):

```bash
# Example psql command (replace with your actual DB credentials)
PGPASSWORD=your_db_password psql -U your_db_user -h your_db_host -d your_database -c "DELETE FROM _prisma_migrations;"
```

### Step 5: Resolve the Baseline
Tell Prisma that `0001_init` is already applied (since the tables physically exist from the previous 27 migrations).

Run this directly in the SSH console (in the root of your backend project):
```bash
npx prisma migrate resolve --applied 0001_init
```
*Output should say: "Migration 0001_init marked as applied."*

### Step 6: Deploy New Features
Now that Prisma knows `0001_init` is done, deploy the remaining features (`0002` through `0011`).

Run this directly in the SSH console:
```bash
npx prisma migrate deploy
```
*Output will list migrations 0002 through 0011 successfully applying.*

### Step 7: Restart / Redeploy
Your database is now perfectly synchronized with the exact state of your code.
* If your backend crashed during Step 2, restart the server/container.
* Alternatively, just trigger your CI/CD pipeline to deploy again — it will now pass with flying colors.

---

### FAQ
**Will this delete my user data, products, or orders?**
No. Step 4 only deletes rows from the `_prisma_migrations` table, which is an internal table Prisma uses to track which migrations have run. It does not touch your actual application tables.

**Do I have to do this every time?**
No. This is a one-time synchronization fix. Every future deployment will just run `npx prisma migrate deploy` automatically via your CI/CD pipeline exactly like it used to.
