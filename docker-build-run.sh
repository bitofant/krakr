#!/bin/bash
docker build -t krakr .
docker run -v /var/krakr:/root/user-store --name krakr -d -p 8070:8070 krakr
