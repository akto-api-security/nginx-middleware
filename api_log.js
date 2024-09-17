let friendlyHttpStatus = {
        '200': 'OK',
        '201': 'Created',
        '202': 'Accepted',
        '203': 'Non-Authoritative Information',
        '204': 'No Content',
        '205': 'Reset Content',
        '206': 'Partial Content',
        '300': 'Multiple Choices',
        '301': 'Moved Permanently',
        '302': 'Found',
        '303': 'See Other',
        '304': 'Not Modified',
        '305': 'Use Proxy',
        '306': 'Unused',
        '307': 'Temporary Redirect',
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '402': 'Payment Required',
        '403': 'Forbidden',
        '404': 'Not Found',
        '405': 'Method Not Allowed',
        '406': 'Not Acceptable',
        '407': 'Proxy Authentication Required',
        '408': 'Request Timeout',
        '409': 'Conflict',
        '410': 'Gone',
        '411': 'Length Required',
        '412': 'Precondition Required',
        '413': 'Request Entry Too Large',
        '414': 'Request-URI Too Long',
        '415': 'Unsupported Media Type',
        '416': 'Requested Range Not Satisfiable',
        '417': 'Expectation Failed',
        '418': 'I\'m a teapot',
        '429': 'Too Many Requests',
        '500': 'Internal Server Error',
        '501': 'Not Implemented',
        '502': 'Bad Gateway',
        '503': 'Service Unavailable',
        '504': 'Gateway Timeout',
        '505': 'HTTP Version Not Supported',
    };

    function to_lower_case(r, data, flags) {
        r.sendBuffer(data, flags);
        r.done()
        
        let rawTime = r.variables.time_iso8601;
        let statusText = friendlyHttpStatus[r.variables.status];
        if (statusText == undefined) {
            statusText = "OK";
        }
    
        let sendData = "";
        try {
            sendData = JSON.stringify(JSON.parse(data));
        } catch (err) {
        }

        let res = {
            "path": r.uri + ( r.variables.args ? "?" + r.variables.args : "") ,
            "requestHeaders": JSON.stringify(r.headersIn), 
            "responseHeaders": JSON.stringify(r.headersOut), 
            "method": r.method,
            "requestPayload": r.requestText,
            "responsePayload": sendData,
            "ip": "0.0.0.0",
            "time": ""+(Date.parse(rawTime.split("+")[0])/1000), 
            "statusCode": (""+r.variables.status),
            "type":"HTTP/"+r.httpVersion,
            "status": statusText,
            "akto_account_id": "1000000", 
            "akto_vxlan_id": "123",
            "is_pending" :"false",
            "source":"OTHER"
        }
    
        r.variables.responseBo = JSON.stringify(res);
    
    }
    
    export default { to_lower_case };
