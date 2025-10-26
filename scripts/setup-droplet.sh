#!/bin/bash

echo "🚀 DigitalOcean Droplet Setup for Backstage"
echo "==========================================="

# Configuration
DROPLET_NAME="backstage-server"
REGION="nyc1"
SIZE="s-2vcpu-4gb"
IMAGE="docker-20-04"

echo "📋 Configuration:"
echo "   Droplet: $DROPLET_NAME"
echo "   Region: $REGION"
echo "   Size: $SIZE"
echo "   Image: $IMAGE"
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl not found. Please install it first."
    exit 1
fi

if ! doctl account get &> /dev/null; then
    echo "❌ Please authenticate with DigitalOcean first: doctl auth init"
    exit 1
fi

# Get SSH keys
echo "🔑 Available SSH keys:"
doctl compute ssh-key list --format Name,ID
echo ""
read -p "Enter SSH key ID to use: " SSH_KEY_ID

if [ -z "$SSH_KEY_ID" ]; then
    echo "❌ SSH key ID is required"
    exit 1
fi

echo ""
read -p "🤔 Create droplet with these settings? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "1️⃣ Creating droplet..."
doctl compute droplet create $DROPLET_NAME \
  --region $REGION \
  --image $IMAGE \
  --size $SIZE \
  --ssh-keys $SSH_KEY_ID \
  --wait

if [ $? -eq 0 ]; then
    echo "✅ Droplet created successfully"
else
    echo "❌ Failed to create droplet"
    exit 1
fi

# Get droplet IP
DROPLET_IP=$(doctl compute droplet list $DROPLET_NAME --format PublicIPv4 --no-header)
echo "   Droplet IP: $DROPLET_IP"

echo ""
echo "2️⃣ Waiting for droplet to be ready..."
sleep 30

echo ""
echo "3️⃣ Setting up droplet..."

# Create setup script
cat > /tmp/droplet-setup.sh << 'EOF'
#!/bin/bash

echo "🔧 Setting up Backstage environment..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl git nginx certbot python3-certbot-nginx

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/backstage
cd /opt/backstage

# Clone repository (user will need to provide the repo URL)
echo "✅ Setup complete. Ready for application deployment."
EOF

# Copy and run setup script
scp /tmp/droplet-setup.sh root@$DROPLET_IP:/tmp/
ssh root@$DROPLET_IP "chmod +x /tmp/droplet-setup.sh && /tmp/droplet-setup.sh"

if [ $? -eq 0 ]; then
    echo "✅ Droplet setup complete"
else
    echo "❌ Failed to setup droplet"
    exit 1
fi

echo ""
echo "4️⃣ Creating managed database..."
doctl databases create backstage-db \
  --engine postgres \
  --region $REGION \
  --size db-s-1vcpu-1gb \
  --version 15

echo ""
echo "✅ Infrastructure setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. SSH to droplet: ssh root@$DROPLET_IP"
echo "   2. Clone your repository: git clone <your-repo-url> /opt/backstage"
echo "   3. Create .env file with database credentials"
echo "   4. Run: docker-compose -f docker-compose.prod.yml up -d"
echo "   5. Setup domain/DNS to point to: $DROPLET_IP"
echo ""
echo "🔗 Resources created:"
echo "   • Droplet: $DROPLET_NAME ($DROPLET_IP)"
echo "   • Database: backstage-db"