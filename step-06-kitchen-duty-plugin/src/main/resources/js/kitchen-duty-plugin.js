//
// COMMON CODE
//
var showSuccessFlag = function(message) {
    require(['aui/flag'], function(flag) {
        flag({
            type: 'success',
            title: 'Kitchen Duty Plugin',
            close: 'auto',
            body: message
        });
    });
};
var showErrorFlag = function(message) {
    require(['aui/flag'], function(flag) {
        flag({
            type: 'error',
            title: 'Kitchen Duty Plugin',
            close: 'auto',
            body: message
        });
    });
};
