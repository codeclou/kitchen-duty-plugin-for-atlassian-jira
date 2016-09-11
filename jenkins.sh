#!/bin/bash

#
# FUNCTIONS
#
function abort_build_if_previous_command_terminated_with_error {
    if [ $? -ne 0 ]; then echo "ERROR. EXIT."; exit 1; fi
}

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
# INSTALL NPM
#
if [ ! -f "node-v6.3.1-linux-x64.tar.xz" ]
then
  cd $WORKSPACE
  wget --no-check-certificate https://nodejs.org/dist/v6.3.1/node-v6.3.1-linux-x64.tar.xz
  tar xf node-v6.3.1-linux-x64.tar.xz
fi
export PATH=$WORKSPACE/node-v6.3.1-linux-x64/bin:$PATH

npm -version

#
#
# NPM BUILD
#
npm install
abort_build_if_previous_command_terminated_with_error

npm run ndes replace "___TIMEST___" byCurrentTimetamp             in "_page/js/main.js" -s
npm run ndes replace "___BRANCH___" byValue "$GITHUB_BRANCH_NAME" in "_page/js/main.js" -s
npm run ndes replace "___COMMIT___" byValue "$GITHUB_COMMIT_HASH" in "_page/js/main.js" -s


npm run build:img
abort_build_if_previous_command_terminated_with_error

npm run build:prod
abort_build_if_previous_command_terminated_with_error

#
# NPM DEPLOY
#

# FIXME: FIRST TEST BUILD THEN DEPLOY

#npm run ndes deployToGitHubPages \
#    as "jenkins" \
#    withEmail "noreply@comsysto.com" \
#    withGitHubAuthUsername $GITHUB_AUTH_USER \
#    withGitHubAuthToken $GITHUB_AUTH_TOKEN \
#    toRepository https://github.com/comsysto/kitchen-duty-plugin-for-atlassian-jira.git \
#    fromSource "./build"
#abort_build_if_previous_command_terminated_with_error
#echo "Deployed to https://comsysto.github.io/kitchen-duty-plugin-for-atlassian-jira/"
