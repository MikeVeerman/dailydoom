#!/bin/bash
# Daily Doom Local Testing Helper
# Starts local server and runs playtester suite

PORT="${DAILYDOOM_TEST_PORT:-8080}"

echo "🚀 Starting Daily Doom local testing..."

echo "🏷️ Validating asset versioning renderer..."
node scripts/test-asset-versioning.mjs || exit 1

# Start local server in background
echo "📡 Starting local server on port $PORT..."
python3 -m http.server "$PORT" &
SERVER_PID=$!

# Give server time to start
sleep 2

# Run tests
echo "🧪 Running playtester suite..."
cd playtester && DAILYDOOM_URL="http://localhost:$PORT" node run-tests.js

TEST_EXIT_CODE=$?

# Clean up server
echo "🧹 Cleaning up local server..."
kill $SERVER_PID 2>/dev/null

# Exit with test result
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed!"
fi

exit $TEST_EXIT_CODE
