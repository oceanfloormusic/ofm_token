#!/bin/bash

remixd -v &> /dev/null
if [ $? != 0 ]; then 
	echo 'remixd is not installed'
	exit 1
fi
echo 'remixd version' `remixd -v`
echo '[INFO] exposing workspace dir - '`pwd` 'to https://remix.ethereum.org'  
remixd -s `pwd` -remix-ide https://remix.ethereum.org