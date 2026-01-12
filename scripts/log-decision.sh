#!/bin/bash

# Script to log architecture decisions to the database
# Usage: ./log-decision.sh "type" "decision" "reasoning" "impact"

TYPE=$1
DECISION=$2
REASONING=$3
IMPACT=${4:-medium}

if [ -z "$TYPE" ] || [ -z "$DECISION" ] || [ -z "$REASONING" ]; then
    echo "Usage: ./log-decision.sh \"type\" \"decision\" \"reasoning\" [impact]"
    echo "Types: architecture, database, framework, api, security, deployment, infrastructure, agent"
    echo "Impact: critical, high, medium, low"
    exit 1
fi

PGPASSWORD=OceanSecure2026!DB psql -U ocean_user -d ocean_db << EOF
INSERT INTO decisions (type, decision, reasoning, impact, made_by, created_at)
VALUES ('$TYPE', '$DECISION', '$REASONING', '$IMPACT', 'team', NOW());
EOF

echo "✅ Decision logged: $DECISION"
