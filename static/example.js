function moduleDidLoad() {
    //载入模块之后要做的事
}

function post(msg){
common.naclModule.postMessage(msg);
}