#!/bin/sh



target=$1
email=""

echo "$target"
if [[ -z $target ]]
then 
    echo "please specify the target such as github, gitlab"
    exit 0
fi 
   

if [[ ! -f ~/.git-account ]]; then
    warn "~/.git-account not exist, please run 
    \n $> switch-helper -u to regenerate the git account info
    or you can run 
    $> ssh-keygen -t rsa -C "'<your_email_address>'"
    to generate normally
    "
fi

. ~/.git-account

if [ $target = 'github' ]
then 
    email="$githubEmail"
elif [ $target = 'gitlab' ]
then 
    email="$gitlabEmail"
else 
    echo "please input github/gitlab"
    exit 0
fi

keyPath="${HOME}/.ssh/id_rsa_$target"
echo "detect the email is $email"
echo "============================================================="
echo  "\033[33m Please enter the file path: \033[4m ${keyPath}\033[0m\n \033[33m And this has been copied into clipboard\033[0m"
echo ${keyPath} | pbcopy
echo "============================================================="

if [ -n $email ]
then 
    ssh-keygen -t ed25519 -C "$email"
fi

# TODO: detect if it's terminated

pbcopy < ${keyPath}.pub

echo "============================================================="
echo "the publish key has been copied into the clipboard!"
echo "Now you need to add the ssh key to the ${target} account"
echo "You can follow the docs if you have no idea about it :) "
[[ ${target} == 'github' ]] &&  echo "https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account" || echo "https://docs.gitlab.com/ee/ssh/#add-an-ssh-key-to-your-gitlab-account"