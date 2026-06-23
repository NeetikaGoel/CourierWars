#!/bin/bash

# go to frontend folder
cd "$(dirname "$0")/../frontend" || exit 1

# start vite frontend
npm run dev