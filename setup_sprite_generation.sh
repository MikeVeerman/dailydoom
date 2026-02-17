#!/bin/bash
# Daily Doom Sprite Generation Setup

echo "🎮 Setting up Daily Doom sprite generation..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3 first."
    exit 1
fi

# Install required packages
echo "📦 Installing Python dependencies..."
pip3 install requests pathlib

# Make generation script executable
chmod +x generate_sprites.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get Replicate API token: https://replicate.com/account/api-tokens"
echo "2. Set environment variable:"
echo "   export REPLICATE_API_TOKEN='your_token_here'"
echo "3. Run sprite generation:"
echo "   ./generate_sprites.py"
echo ""
echo "💰 Expected cost: ~\$1.50-2.00 for initial sprite pack (10 sprites)"
echo "🎨 Generates: demons, zombies, weapons, items, effects"