#!/bin/bash
cd "$(dirname "$0")"

python3 -m http.server 8080 &
SERVER_PID=$!

sleep 1

open http://localhost:8080

echo ""
echo "✅ Recepten Generator draait op http://localhost:8080"
echo "   Sluit dit venster om de server te stoppen."
echo ""
wait $SERVER_PID
