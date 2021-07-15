# unary expression
# name=$1
# [[ $name == 'homy' ]] && echo $name || echo 'tom'

# str split 

function str2arr(){
    return ( `echo $1 | tr ',' ' '` )
}
str="origin upstream"
arr=str2arr(str) # conver str ---> array
echo ${arr}
# name=$([[ $(git remote | wc -l) -ge 1 ]] && ${str//,/ })
# echo $name