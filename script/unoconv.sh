#!/bin/bash

if [ -z "$1" ]; then
    echo "Must pass file";
    exit 10;
fi

/usr/bin/unoconv -f pdf $1