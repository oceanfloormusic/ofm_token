#!/bin/bash

remixd -v &> /dev/null
if [ $? != 0 ]; then 
	echo 'remixd is not installed'
	exit 1
fi
echo 'remixd version' `remixd -v`
echo '[INFO] exposing workspace dir - '`pwd` 'to https://remix.ethereum.org'  
remixd -s 'A:\AnUrAG\VegaVid Technology\Assignment\ofmx changes\github\ofm_token' -remix-ide https://remix.ethereum.org