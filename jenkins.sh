#!/bin/bash

set -e

#
# PREREQUISITES
#
if [ -z ${WORKSPACE+x} ]; then echo "ERROR WORKSPACE is unset"; exit 1; fi
if [ -z ${GITHUB_BRANCH_NAME+x} ]; then echo "ERROR GITHUB_BRANCH_NAME is unset"; exit 1; fi
if [ -z ${GITHUB_COMMIT_HASH+x} ]; then echo "ERROR GITHUB_COMMIT_HASH is unset"; exit 1; fi
if [ -z ${GITHUB_AUTH_USER+x} ]; then echo "ERROR GITHUB_AUTH_USER is unset"; exit 1; fi
if [ -z ${GITHUB_AUTH_TOKEN+x} ]; then echo "ERROR GITHUB_AUTH_TOKEN is unset"; exit 1; fi


#
# ONLY BUILD CERTAIN BRANCHES
#

if [ "$GITHUB_BRANCH_NAME" != "documentation" ]
then
  echo "WARN: will not build branch: $GITHUB_BRANCH_NAME"
  exit 0;
fi

#
# INSTALL NODE AND YARN
#
if [ ! -f "node-v8.11.4-linux-x64.tar.xz" ]
then
  cd $WORKSPACE
  wget --no-check-certificate https://nodejs.org/dist/v8.11.4/node-v8.11.4-linux-x64.tar.xz
  tar xf node-v8.11.4-linux-x64.tar.xz
fi
export PATH=$WORKSPACE/node-v8.11.4-linux-x64/bin:$PATH
npm -version

#
# INSTALL YARN
#
curl -o- -L https://yarnpkg.com/install.sh | bash
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
yarn -v

#
# INSTALL DEPS
#
yarn install

#
# BUILD
#
yarn ndes replace "___TIMEST___" byCurrentTimetamp             in "_page/js/main.js" -s
yarn ndes replace "___BRANCH___" byValue "$GITHUB_BRANCH_NAME" in "_page/js/main.js" -s
yarn ndes replace "___COMMIT___" byValue "$GITHUB_COMMIT_HASH" in "_page/js/main.js" -s

yarn build:img
yarn build:prod

#
# DEPLOY
#
yarn ndes deployToGitHubPages \
    as "jenkins" \
    withEmail "noreply@comsysto.com" \
    withGitHubAuthUsername $GITHUB_AUTH_USER \
    withGitHubAuthToken $GITHUB_AUTH_TOKEN \
    toRepository https://github.com/comsysto/kitchen-duty-plugin-for-atlassian-jira.git \
    fromSource "./build"
echo "Deployed to https://comsysto.github.io/kitchen-duty-plugin-for-atlassian-jira/"
