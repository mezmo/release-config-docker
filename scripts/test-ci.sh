#!/bin/bash
npm run tap -- -R tap

code=$?
npm run tap replay -- -R junit --reporter-file .tap/test.xml
exit $code
