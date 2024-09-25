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

/* 
example for 10 % sampling value = 10,
for 20% sampling value = 5
for 50% sampling value = 2
for 100% sampling value = 1
*/
const SAMPLE_RATE_MOD = 5;
const RESET_COUNTER_VALUE = 50000;

function to_lower_case(r, data, flags) {
    r.sendBuffer(data, flags);
    r.done()

    // sampling logic
    try {
        if (!ngx.shared.sampleRateCounter.has("count")) {
            ngx.shared.sampleRateCounter.set("count", 0);
        }
        let count = ngx.shared.sampleRateCounter.incr("count", 1);
        if (count % SAMPLE_RATE_MOD != 0) {
            return;
        }
        if (count > RESET_COUNTER_VALUE) {
            ngx.shared.sampleRateCounter.clear()
        }
    } catch (err1){
    }

    let rawTime = r.variables.time_iso8601;
    let statusText = friendlyHttpStatus[r.variables.status];
    if (statusText == undefined) {
        statusText = "OK";
    }

    let sendData = "";
    try {
        let tmp = new Uint8Array(data)
        const decoder = new TextDecoder('utf-8');
        sendData = decoder.decode(tmp);
    } catch (err) {
    }

    let res = {
        "path": r.uri + (r.variables.args ? "?" + r.variables.args : ""),
        "requestHeaders": JSON.stringify(r.headersIn),
        "responseHeaders": JSON.stringify(r.headersOut),
        "method": r.method,
        "requestPayload": r.requestText,
        "responsePayload": sendData,
        "ip": "0.0.0.0",
        "time": "" + (Date.parse(rawTime.split("+")[0]) / 1000),
        "statusCode": ("" + r.variables.status),
        "type": "HTTP/" + r.httpVersion,
        "status": statusText,
        "akto_account_id": "1000000",
        "akto_vxlan_id": "0",
        "is_pending": "false",
        "source": "MIRRORING"
    }

    let i = 0;
    if (ngx.shared.counter.has("count")) {
        i = ngx.shared.counter.get("count")
    }
    ngx.shared.tempData.set(i, JSON.stringify(res));
    i++;
    ngx.shared.counter.set("count", i);
}

const BATCH_SIZE = 100;
const LINGER_TIME = 10;

async function call_http(r) {

    let rawTime = (Date.parse(r.variables.time_iso8601.split("+")[0]) / 1000);

    if (!ngx.shared.counter.has("timer")) {
        ngx.shared.counter.set("timer", rawTime);
    }

    if ((ngx.shared.counter.has("count") &&
        ngx.shared.counter.get("count") >= BATCH_SIZE) ||
        (ngx.shared.counter.has("timer") &&
            ((rawTime - ngx.shared.counter.get("timer")) >= LINGER_TIME))) {

        ngx.shared.counter.set("timer", rawTime);

        try {
            let items = ngx.shared.tempData.items()
            let arr = []
            for (let i in items) {
                let tmp = items[i][1]
                arr.push(JSON.parse(tmp))
            }
            let data = { batchData: arr }
            await r.subrequest('/akto_api_url',
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                    detached: true
                }
            )
        } catch (e) {
        } finally {
            ngx.shared.tempData.clear()
            ngx.shared.counter.clear()
        }
    }

    r.return(200, "hello");
}

export default { to_lower_case, call_http };
