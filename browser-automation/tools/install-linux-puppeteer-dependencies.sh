#!/bin/bash

# Define the packages and their versions
declare -A packages=(
    ["libasound2"]="1.2.6.1-1ubuntu1"
    ["libatk-bridge2.0-0"]="2.38.0-3"
    ["libatk1.0-0"]="2.36.0-3build1"
    ["libatspi2.0-0"]="2.44.0-3"
    ["libc6"]="2.35-0ubuntu3.6"
    ["libcairo2"]="1.16.0-5ubuntu2"
    ["libcups2"]="2.4.1op1-1ubuntu4.7"
    ["libdbus-1-3"]="1.12.20-2ubuntu4.1"
    ["libdrm2"]="2.4.113-2~ubuntu0.22.04.1"
    ["libexpat1"]="2.4.7-1ubuntu0.2"
    ["libgbm1"]="23.0.4-0ubuntu1~22.04.1"
    ["libglib2.0-0"]="2.72.4-0ubuntu2.2"
    ["libnspr4"]="2:4.32-3build1"
    ["libnss3"]="2:3.68.2-0ubuntu1.2"
    ["libpango-1.0-0"]="1.50.6+ds-2ubuntu1"
    ["libpangocairo-1.0-0"]="1.50.6+ds-2ubuntu1"
    ["libstdc++6"]="12.3.0-1ubuntu1~22.04"
    ["libuuid1"]="2.37.2-4ubuntu3"
    ["libx11-6"]="2:1.7.5-1ubuntu0.3"
    ["libx11-xcb1"]="2:1.7.5-1ubuntu0.3"
    ["libxcb-dri3-0"]="1.14-3ubuntu3"
    ["libxcb1"]="1.14-3ubuntu3"
    ["libxcomposite1"]="1:0.4.5-1build2"
    ["libxcursor1"]="1:1.2.0-2build4"
    ["libxdamage1"]="1:1.1.5-2build2"
    ["libxext6"]="2:1.3.4-1build1"
    ["libxfixes3"]="1:6.0.0-1"
    ["libxi6"]="2:1.8-1build1"
    ["libxkbcommon0"]="1.4.0-1"
    ["libxrandr2"]="2:1.5.2-1build1"
    ["libxrender1"]="1:0.9.10-1build4"
    ["libxshmfence1"]="1.3-1build4"
    ["libxss1"]="1:1.2.3-1build2"
    ["libxtst6"]="2:1.2.3-1build4"
)

# Update package list
sudo apt update

# Install each package with the specified version
for pkg in "${!packages[@]}"; do
    version=${packages[$pkg]}
    sudo apt install -y "${pkg}=${version}"
done

# Clean up
sudo apt clean

echo "All specified packages have been installed."
