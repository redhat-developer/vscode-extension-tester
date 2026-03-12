#!/bin/bash
# Test script for VS Code version update automation
# This script validates the version update logic locally

set -e

echo "🔍 Testing VS Code Version Update Logic"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check dependencies
echo "📋 Checking dependencies..."
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies available${NC}"
echo ""

# Fetch latest versions from VS Code API
echo "🌐 Fetching latest VS Code versions from API..."
RELEASES=$(curl -sf https://update.code.visualstudio.com/api/releases/stable)

if [ -z "$RELEASES" ]; then
    echo -e "${RED}❌ Failed to fetch VS Code releases${NC}"
    exit 1
fi

# Get unique major.minor versions and find latest patch for each
# This gives us the latest 3 major versions with their latest patches
echo "🔍 Finding latest 3 major versions..."
MAJOR_VERSIONS=$(echo $RELEASES | jq -r '.[]' | sed -E 's/([0-9]+\.[0-9]+)\..*/\1/' | uniq | head -3)

# Validate we have at least 3 major versions
COUNT=$(echo "$MAJOR_VERSIONS" | wc -l | tr -d ' ')
if [ "$COUNT" -lt 3 ]; then
    echo -e "${RED}❌ Not enough major versions available (found $COUNT, need 3)${NC}"
    exit 1
fi

# Get the latest patch version for each of the 3 major versions
MAJOR_1=$(echo "$MAJOR_VERSIONS" | sed -n '1p')
MAJOR_2=$(echo "$MAJOR_VERSIONS" | sed -n '2p')
MAJOR_3=$(echo "$MAJOR_VERSIONS" | sed -n '3p')

LATEST=$(echo $RELEASES | jq -r ".[] | select(startswith(\"$MAJOR_1\"))" | head -1)
MIDDLE=$(echo $RELEASES | jq -r ".[] | select(startswith(\"$MAJOR_2\"))" | head -1)
OLDEST=$(echo $RELEASES | jq -r ".[] | select(startswith(\"$MAJOR_3\"))" | head -1)

echo "   Major versions: $MAJOR_1, $MAJOR_2, $MAJOR_3"

echo -e "${GREEN}✅ Successfully fetched versions${NC}"
echo "   Latest: $LATEST"
echo "   Middle: $MIDDLE"
echo "   Oldest: $OLDEST"
echo ""

# Validate version format
echo "🔍 Validating version formats..."
for VERSION in $LATEST $MIDDLE $OLDEST; do
    if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "${RED}❌ Invalid version format: $VERSION${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All versions have valid format${NC}"
echo ""

# Get current values from package.json
echo "📦 Reading current versions from package.json..."
CURRENT_MAX=$(jq -r '.supportedVersions["vscode-max"]' packages/extester/package.json)
CURRENT_MIN=$(jq -r '.supportedVersions["vscode-min"]' packages/extester/package.json)

echo "   Current Min: $CURRENT_MIN"
echo "   Current Max: $CURRENT_MAX"
echo ""

# Get current middle version from CI workflow
echo "🔧 Reading current middle version from CI workflow..."
CURRENT_MIDDLE=$(grep 'version: \[min,' .github/workflows/main.yml | sed -E 's/.*version: \[min, ([^,]+),.*/\1/' | tr -d ' ')
echo "   Current Middle: $CURRENT_MIDDLE"
echo ""

# Check if update is needed
echo "🔎 Checking if update is needed..."
NEEDS_UPDATE=false

if [ "$LATEST" != "$CURRENT_MAX" ]; then
    echo -e "${YELLOW}📌 Max version needs update: $CURRENT_MAX → $LATEST${NC}"
    NEEDS_UPDATE=true
fi

if [ "$OLDEST" != "$CURRENT_MIN" ]; then
    echo -e "${YELLOW}📌 Min version needs update: $CURRENT_MIN → $OLDEST${NC}"
    NEEDS_UPDATE=true
fi

if [ "$MIDDLE" != "$CURRENT_MIDDLE" ]; then
    echo -e "${YELLOW}📌 Middle version needs update: $CURRENT_MIDDLE → $MIDDLE${NC}"
    NEEDS_UPDATE=true
fi

if [ "$NEEDS_UPDATE" = false ]; then
    echo -e "${GREEN}✅ No updates needed - versions are current!${NC}"
else
    echo ""
    echo "📊 Summary of Changes Needed:"
    echo "┌─────────────┬──────────────┬──────────────┐"
    echo "│ Position    │ Current      │ New          │"
    echo "├─────────────┼──────────────┼──────────────┤"
    printf "│ Min         │ %-12s │ %-12s │\n" "$CURRENT_MIN" "$OLDEST"
    printf "│ Middle      │ %-12s │ %-12s │\n" "$CURRENT_MIDDLE" "$MIDDLE"
    printf "│ Max         │ %-12s │ %-12s │\n" "$CURRENT_MAX" "$LATEST"
    echo "└─────────────┴──────────────┴──────────────┘"
fi

echo ""
echo "🎉 Validation complete!"
echo ""
echo "💡 Next steps:"
if [ "$NEEDS_UPDATE" = true ]; then
    echo "   1. The automated workflow will create a PR with these updates"
    echo "   2. Or you can manually trigger the workflow at:"
    echo "      https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/update-vscode-versions.yml"
else
    echo "   - Versions are up to date"
    echo "   - The workflow will check again next Monday"
fi

# Made with Bob
