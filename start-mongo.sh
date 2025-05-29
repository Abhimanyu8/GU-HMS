
#!/bin/bash
mkdir -p /tmp/mongodb-data
mongod --dbpath /tmp/mongodb-data --port 27017 --bind_ip 127.0.0.1 --noauth &
echo "MongoDB started on port 27017"
