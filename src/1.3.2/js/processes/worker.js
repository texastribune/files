
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

let id = 0;

let calls = {};

const system = new Proxy({}, {
    get: function (obj, prop) {
        return (...args) => {
            return new Promise((resolve, reject) => {
                id ++;
                calls[id] = resolve;
                postMessage([id, prop].concat(args));
            });
        }
    }
});


onmessage = function(e) {
    console.log('Message received from main script');

    if (Array.isArray(e.data)){
        let id = e.data[0];
        let data = e.data[1];
        let sysCall = calls[id];
        if (sysCall){
            delete calls[id];
            sysCall(data);
        }
    } else {
        let func = new AsyncFunction(e.data);
        func.bind(this)()
            .then((returnValue) => {
                postMessage(returnValue);
            }).catch((error) => {
                console.log(error);
                postMessage(-1);
            });
    }
};