#!/bin/sh
set -eu
mkdir -p dist
cp index.html 404.html style.css app.mjs events.mjs robots.txt _routes.json ads.txt privacy.html dist/
