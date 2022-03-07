function to_lower_case(r, data, flags) {
	r.sendBuffer(data.toLowerCase(), flags);
	r.done()
	var request = {
		"client": r.variables.remote_addr,
		"port": Number(r.variables.server_port),
		"host": r.variables.host,
		"method": r.method,
		"uri": r.uri,
		"http_version": Number(r.httpVersion),
		"bytes_received": Number(r.variables.request_length)
	};
	request.headers = {};
	for (var h in r.headersIn) {
		request.headers[h] = r.headersIn[h];
	}
	
	var response = {
    "status": Number(r.variables.status),
    "bytes_sent": Number(r.variables.bytes_sent),
	}
	response.headers = {};
	for (var h in r.headersOut) {
    response.headers[h] = r.headersOut[h];
	}

	r.variables.responseBo = JSON.stringify({
    "timestamp": r.variables.time_iso8601,
    "request": request,
    "response": response,
		"body": data
	});
}

export default {to_lower_case};
