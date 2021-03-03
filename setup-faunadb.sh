#!/bin/bash

fauna add-endpoint http://localhost:8443/ --alias localhost --key secret
fauna create-database chatskee --endpoint=localhost
fauna create-key chatskee --endpoint=localhost

echo "Paste the secret into 'NEXT_PUBLIC_FAUNADB_KEY' in .env.local"