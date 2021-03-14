#!/bin/bash

fauna add-endpoint http://localhost:8443/ --alias localhost --key secret
fauna create-database chatskee --endpoint=localhost
fauna create-key chatskee server --endpoint=localhost
echo "Paste the secret into 'FAUNADB_SERVER_KEY' in .env.local"
fauna create-key chatskee admin --endpoint=localhost
echo "Paste the secret into 'FAUNA_ADMIN_KEY' in .env.local"
