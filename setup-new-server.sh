#!/bin/bash

# OCEAN Platform - New Hetzner Server Setup Script
# Server: oc (77.42.44.61)
# Run this script after SSH password change

set -e

echo "🌊 OCEAN Platform Setup - Starting..."
echo "========================================"

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
apt-get install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    ufw \
    fail2ban \
    postgresql \
    postgresql-contrib \
    redis-server \
    docker.io \
    docker-compose \
    nodejs \
    npm

# Enable and start services
echo "🚀 Starting services..."
systemctl enable postgresql
systemctl start postgresql
systemctl enable redis-server
systemctl start redis-server
systemctl enable docker
systemctl start docker

# Configure firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Frontend
ufw allow 3001/tcp  # API Proxy
ufw allow 5432/tcp  # PostgreSQL (internal)

# Clone OCEAN repository
echo "📥 Cloning OCEAN repository..."
cd /opt
if [ -d "ocean" ]; then
    echo "Directory exists, pulling latest..."
    cd ocean
    git pull
else
    git clone https://github.com/t4tarzan/OCean.git ocean
    cd ocean
fi

# Create PostgreSQL database and user
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
-- Create database
CREATE DATABASE ocean_db;

-- Create user with secure password
CREATE USER ocean_user WITH PASSWORD 'OceanSecure2026!DB';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ocean_db TO ocean_user;

-- Connect to ocean_db and grant schema privileges
\c ocean_db
GRANT ALL ON SCHEMA public TO ocean_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ocean_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ocean_user;

\q
EOF

# Load database schema
echo "📊 Loading database schema..."
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -f /opt/ocean/database/schema.sql

# Install Node.js dependencies for scripts
echo "📦 Installing Node.js dependencies..."
cd /opt/ocean/scripts
npm install pg

# Load PRD tracking data
echo "📋 Loading PRD tracking data..."
export OCEAN_DB_PASSWORD='OceanSecure2026!DB'
npx tsx load-prd-to-db.ts

# Create .env file
echo "⚙️ Creating environment configuration..."
cat > /opt/ocean/.env <<ENVEOF
# Database
DATABASE_URL=postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ocean_db
POSTGRES_USER=ocean_user
POSTGRES_PASSWORD=OceanSecure2026!DB

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Neo4j (to be configured)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=OceanNeo4j2026!

# Qdrant (to be configured)
QDRANT_URL=http://localhost:6333

# Server
NODE_ENV=production
PORT=3000
API_PROXY_PORT=3001

# API Keys (to be added)
CLAUDE_API_KEY=your-claude-key-here
GEMINI_API_KEY=your-gemini-key-here
OPENAI_API_KEY=your-openai-key-here
ENVEOF

# Display completion message
echo ""
echo "✅ OCEAN Platform Setup Complete!"
echo "========================================"
echo ""
echo "📊 Database Status:"
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -c "SELECT * FROM prd_progress;" 2>/dev/null || echo "Database ready, run queries manually"
echo ""
echo "🎯 Next Steps:"
echo "1. View PRD progress: psql -U ocean_user -d ocean_db -c 'SELECT * FROM prd_progress;'"
echo "2. View current tasks: psql -U ocean_user -d ocean_db -c 'SELECT * FROM prd_current_week;'"
echo "3. Start Phase 1: cd /opt/ocean && cat ocean1.md"
echo ""
echo "📁 Repository location: /opt/ocean"
echo "🔗 GitHub: https://github.com/t4tarzan/OCean"
echo ""
echo "🌊 Ready to build OCEAN!"
