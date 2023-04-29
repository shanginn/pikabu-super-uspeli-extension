#!/bin/bash

# Get version from package.json
version=$(node -p "require('./package.json').version")

# Check if tag exists
tag_exists=$(git tag --list "v$version")

# Create tag if it doesn't exist
if [ -z "$tag_exists" ]; then
  echo "Tag 'v$version' does not exist. Creating it now."
  git tag -a "v$version" -m "Create tag 'v$version' from script"
  echo "Tag 'v$version' created."
  echo "Pushing tag 'v$version' to the remote repository."
  git push origin "v$version"
else
  echo "Tag 'v$version' already exists."
fi
