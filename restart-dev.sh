#!/bin/bash

# Barakah.Social Development Server Restart Script
# Use this script when CSS is not loading properly

echo "🔄 Stopping existing dev server..."
pkill -f "next dev"

sleep 2

echo "🗑️  Clearing .next cache..."
rm -rf .next

echo "🚀 Starting fresh dev server..."
source ~/.zshrc && npm run dev

