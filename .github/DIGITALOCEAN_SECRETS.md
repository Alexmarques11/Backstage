# GitHub Secrets Configuration for DigitalOcean Deployment

To enable automatic deployment to DigitalOcean, you need to configure the following secrets in your GitHub repository.

## How to Add Secrets

1. Go to your GitHub repository: `https://github.com/Alexmarques11/Backstage`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

---

## Required Secrets

### 1. DigitalOcean Authentication

#### `DIGITALOCEAN_ACCESS_TOKEN`
- **Description**: Your DigitalOcean API token for authentication
- **How to get it**:
  1. Go to https://cloud.digitalocean.com/account/api/tokens
  2. Click "Generate New Token"
  3. Give it a name (e.g., "GitHub Actions Deploy")
  4. Check "Write" scope
  5. Copy the token (you'll only see it once!)
- **Example value**: `dop_v1_abc123def456...` (starts with `dop_v1_`)

#### `DIGITALOCEAN_CLUSTER_ID`
- **Description**: Your Kubernetes cluster ID or name
- **How to get it**:
  ```bash
  doctl kubernetes cluster list
  ```
  Or from the DO dashboard: Kubernetes → Your Cluster → Settings
- **Example value**: `backstage-cluster` or `a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6`

---

### 2. Database Configuration

These are the credentials for your **DigitalOcean Managed PostgreSQL Database**.

#### `DO_DATABASE_HOST`
- **Description**: PostgreSQL database hostname
- **How to get it**: DigitalOcean Dashboard → Databases → Your Database → Connection Details → Host
- **Example value**: `backstage-db-do-user-12345678-0.b.db.ondigitalocean.com`

#### `DO_DATABASE_PORT`
- **Description**: PostgreSQL database port
- **Default value**: `25060` (DigitalOcean managed databases)
- **How to get it**: Same location as host, under "Port"

#### `DO_DATABASE_USER`
- **Description**: PostgreSQL database username
- **How to get it**: DigitalOcean Dashboard → Databases → Your Database → Users & Databases tab
- **Example value**: `doadmin` (default) or your custom user

#### `DO_DATABASE_PASSWORD`
- **Description**: PostgreSQL database password
- **How to get it**: 
  - For `doadmin`: Click "Show" next to the password in Connection Details
  - For custom user: Use the password you set when creating the user
- **Example value**: `AVNS_abc123def456...` (long random string)

#### `DO_DATABASE_NAME`
- **Description**: PostgreSQL database name
- **How to get it**: DigitalOcean Dashboard → Databases → Your Database → Users & Databases tab
- **Default value**: `defaultdb`
- **Recommended**: Create a database named `backstage`

---

### 3. Application Secrets

These are used by your Node.js application for JWT authentication.

#### `DO_ACCESS_TOKEN_SECRET`
- **Description**: Secret key for generating JWT access tokens
- **How to generate**: Run this command:
  ```bash
  openssl rand -hex 32
  ```
- **Example value**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6` (64 characters)

#### `DO_REFRESH_TOKEN_SECRET`
- **Description**: Secret key for generating JWT refresh tokens
- **How to generate**: Run this command (generate a different one):
  ```bash
  openssl rand -hex 32
  ```
- **Example value**: `z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4` (64 characters)

---

## Quick Setup Commands

### Generate the JWT secrets:
```bash
echo "DO_ACCESS_TOKEN_SECRET: $(openssl rand -hex 32)"
echo "DO_REFRESH_TOKEN_SECRET: $(openssl rand -hex 32)"
```

### Get your DigitalOcean cluster ID:
```bash
doctl kubernetes cluster list --format ID,Name
```

### Get your database connection info:
```bash
doctl databases connection YOUR_DATABASE_NAME --format Host,Port,User,Database
```

---

## Summary Checklist

Before enabling the workflow, make sure you have all these secrets configured:

- [ ] `DIGITALOCEAN_ACCESS_TOKEN` - Your DO API token
- [ ] `DIGITALOCEAN_CLUSTER_ID` - Your Kubernetes cluster ID/name
- [ ] `DO_DATABASE_HOST` - PostgreSQL hostname
- [ ] `DO_DATABASE_PORT` - PostgreSQL port (usually 25060)
- [ ] `DO_DATABASE_USER` - PostgreSQL username
- [ ] `DO_DATABASE_PASSWORD` - PostgreSQL password
- [ ] `DO_DATABASE_NAME` - PostgreSQL database name
- [ ] `DO_ACCESS_TOKEN_SECRET` - JWT access token secret (32 bytes hex)
- [ ] `DO_REFRESH_TOKEN_SECRET` - JWT refresh token secret (32 bytes hex)

---

## Testing the Workflow

### Automatic trigger:
The workflow runs automatically when Docker images are successfully pushed to Docker Hub (after merging to `main`).

### Manual trigger:
1. Go to GitHub → Actions → "Deploy to DigitalOcean Kubernetes"
2. Click "Run workflow"
3. Choose branch: `main`
4. Optionally skip tests if needed
5. Click "Run workflow"

---

## Workflow Features

✅ **Automatic deployment** after Docker images are built  
✅ **Manages secrets** in Kubernetes automatically  
✅ **Updates deployments** with new images  
✅ **Runs health checks** to verify deployment  
✅ **Auto-scaling** with HPA configuration  
✅ **Comprehensive tests** (can be skipped if needed)  
✅ **Shows access URLs** after successful deployment  
✅ **Error logs** if deployment fails  

---

## Security Notes

- **Never commit these secrets** to your repository
- **Rotate secrets regularly** (especially the DO access token)
- **Use different JWT secrets** for production vs development
- **Restrict database access** to your Kubernetes cluster IPs only
- **Enable SSL/TLS** for database connections in production

---

## Troubleshooting

If the deployment fails:

1. **Check GitHub Actions logs**: Actions tab → Failed workflow → Click on failed step
2. **Verify secrets**: Make sure all secrets are set correctly (no extra spaces)
3. **Check cluster access**: Ensure your DO token has Kubernetes cluster access
4. **Database connection**: Test database connectivity from DO dashboard
5. **Review pod logs**: The workflow shows pod logs if deployment fails

---

## Need Help?

- Review the workflow file: `.github/workflows/digitalocean-deploy.yml`
- Check deployment status: `kubectl get all -n backstage`
- View pod logs: `kubectl logs -l app=backstage-server -n backstage`
- Run tests manually: `cd k8s/digitalocean && ./test-deployment.sh`
