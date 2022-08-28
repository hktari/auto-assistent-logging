#!/bin/sh
echo "resetting db..."

sudo psql -U hktari -d asistentapp -a -f "./tests/util/resetdb.sql"
sudo psql -U hktari -d asistentapp -a -f "./tests/util/seeddb.sql"