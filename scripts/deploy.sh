#!/bin/bash

# True North Tech AI Agent System - Deployment Script
# This script safely deploys the True North system without affecting IdeaGraph

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   True North Tech AI Agent System Deployment      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI not found${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✓${NC} Wrangler CLI found"

# Verify account
ACCOUNT_ID="3084a71c3a01c15a95432e43c1abb895"
echo -e "${BLUE}→${NC} Using Cloudflare account: ${ACCOUNT_ID}"

# Safety check: Verify we won't touch IdeaGraph resources
echo ""
echo -e "${YELLOW}⚠️  SAFETY CHECK: Verifying no conflicts with IdeaGraph${NC}"
echo "Protected resources:"
echo "  - Worker: ideagraph"
echo "  - D1: ideagraph-db (b8ae71ae-7012-47f7-bd91-dde6e5449b12)"
echo "  - R2: ideagraph-media"
echo ""

read -p "Confirm: All True North resources use 'truenorth-' prefix? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Safety check passed"
echo ""

# Step 1: Create D1 Database
echo -e "${BLUE}[1/7] Creating D1 Database...${NC}"
D1_OUTPUT=$(wrangler d1 create truenorth-agents-db --experimental-backend)
D1_ID=$(echo "$D1_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')

if [ -z "$D1_ID" ]; then
    echo -e "${RED}❌ Failed to create D1 database${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} D1 database created: ${D1_ID}"

# Step 2: Initialize database schema
echo -e "${BLUE}[2/7] Initializing database schema...${NC}"
wrangler d1 execute truenorth-agents-db --file=./truenorth-schema.sql

echo -e "${GREEN}✓${NC} Database schema initialized"

# Step 3: Create KV Namespaces
echo -e "${BLUE}[3/7] Creating KV namespaces...${NC}"

KV_MEMORY_OUTPUT=$(wrangler kv:namespace create "truenorth-agent-memory")
KV_MEMORY_ID=$(echo "$KV_MEMORY_OUTPUT" | grep "id" | awk -F'"' '{print $4}')

KV_DECISIONS_OUTPUT=$(wrangler kv:namespace create "truenorth-agent-decisions")
KV_DECISIONS_ID=$(echo "$KV_DECISIONS_OUTPUT" | grep "id" | awk -F'"' '{print $4}')

KV_CONTEXT_OUTPUT=$(wrangler kv:namespace create "truenorth-agent-context")
KV_CONTEXT_ID=$(echo "$KV_CONTEXT_OUTPUT" | grep "id" | awk -F'"' '{print $4}')

echo -e "${GREEN}✓${NC} KV namespaces created"
echo "  - Memory: ${KV_MEMORY_ID}"
echo "  - Decisions: ${KV_DECISIONS_ID}"
echo "  - Context: ${KV_CONTEXT_ID}"

# Step 4: Create Queue
echo -e "${BLUE}[4/7] Creating message queue...${NC}"
wrangler queues create truenorth-agent-queue

echo -e "${GREEN}✓${NC} Queue created: truenorth-agent-queue"

# Step 5: Update wrangler.toml with IDs
echo -e "${BLUE}[5/7] Updating configuration...${NC}"

sed -i.bak \
    -e "s/YOUR_D1_DATABASE_ID/${D1_ID}/g" \
    -e "s/YOUR_KV_MEMORY_ID/${KV_MEMORY_ID}/g" \
    -e "s/YOUR_KV_DECISIONS_ID/${KV_DECISIONS_ID}/g" \
    -e "s/YOUR_KV_CONTEXT_ID/${KV_CONTEXT_ID}/g" \
    truenorth-wrangler.toml

echo -e "${GREEN}✓${NC} Configuration updated"

# Step 6: Set secrets
echo -e "${BLUE}[6/7] Setting up secrets...${NC}"

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set in environment${NC}"
    read -sp "Enter your Anthropic API key: " ANTHROPIC_KEY
    echo ""
    echo "$ANTHROPIC_KEY" | wrangler secret put ANTHROPIC_API_KEY
else
    echo "$ANTHROPIC_API_KEY" | wrangler secret put ANTHROPIC_API_KEY
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set in environment${NC}"
    read -sp "Enter your GitHub token (optional, press Enter to skip): " GITHUB_KEY
    echo ""
    if [ -n "$GITHUB_KEY" ]; then
        echo "$GITHUB_KEY" | wrangler secret put GITHUB_TOKEN
    fi
else
    echo "$GITHUB_TOKEN" | wrangler secret put GITHUB_TOKEN
fi

echo -e "${GREEN}✓${NC} Secrets configured"

# Step 7: Deploy all workers
echo -e "${BLUE}[7/7] Deploying agents...${NC}"

echo "  → Deploying Chief of Staff..."
wrangler deploy -c truenorth-wrangler.toml

echo "  → Deploying Market Research Agent..."
wrangler deploy -c truenorth-wrangler.toml --env market-research

echo "  → Deploying UI Designer Agent..."
wrangler deploy -c truenorth-wrangler.toml --env ui-designer

echo "  → Deploying Frontend Engineer Agent..."
wrangler deploy -c truenorth-wrangler.toml --env frontend-engineer

echo "  → Deploying QA Engineer Agent..."
wrangler deploy -c truenorth-wrangler.toml --env qa-engineer

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 DEPLOYMENT SUCCESSFUL! 🎉             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Your True North Tech AI Agent System is now live!"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "  • 5 AI Agents deployed"
echo "  • 1 D1 Database: truenorth-agents-db"
echo "  • 3 KV Namespaces: memory, decisions, context"
echo "  • 1 Message Queue: truenorth-agent-queue"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Test the system:"
echo "     curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"feature_request\": \"Add a dark mode toggle\"}'"
echo ""
echo "  2. Monitor workflows:"
echo "     wrangler tail truenorth-chief-of-staff"
echo ""
echo "  3. View logs:"
echo "     wrangler d1 execute truenorth-agents-db --command='SELECT * FROM workflows'"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  See README.md for API documentation and usage examples"
echo ""
echo -e "${GREEN}✨ Happy building!${NC}"