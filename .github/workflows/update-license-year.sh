#!/bin/bash

license='LICENSE.txt'
prefix='2016-'
current_year=$(date +%Y)
sed -i -e "s/$prefix\([0-9\]\+\)/$prefix$current_year/" $license

if [ "$(git diff $license)" ]; then
  git add $license
  git commit -m "Update license year to $current_year"
  git push
else
  echo "No changes detected in $license"
fi