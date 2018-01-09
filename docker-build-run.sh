#!/bin/bash
docker build -t krakr .
docker run -v ./krakr:/root/user-store --name krakr -d -p 8070:8070 krakr
