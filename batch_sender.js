const SHARED_KEY = "akto_batch";
const URL_KEY = "akto_target_url";

function addToBatch(record, targetUrl) {
    // Persist URL from request context so js_periodic timer can read it later
    if (targetUrl) {
        ngx.shared.akto_batch.set(URL_KEY, targetUrl);
    }
    let batch = _readBatch();
    batch.push(record);
    _writeBatch(batch);
    ngx.log(ngx.INFO, "akto addToBatch: batch size now " + batch.length);
}

async function flushBatch(scheduled) {
    let batch = _readBatch();
    if (batch.length === 0) return;
    _writeBatch([]);
    ngx.log(ngx.INFO, "akto flushBatch (timer): flushing " + batch.length + " records");
    _send(batch);
}

function _readBatch() {
    try {
        let raw = ngx.shared.akto_batch.get(SHARED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function _writeBatch(batch) {
    ngx.shared.akto_batch.set(SHARED_KEY, JSON.stringify(batch));
}

function _send(payload) {
    const targetUrl = ngx.shared.akto_batch.get(URL_KEY);
    let ingestList = payload.map(function(record) {
        let ingestRecord = {
            "path": record.path,
            "requestHeaders": record.requestHeaders,
            "responseHeaders": record.responseHeaders,
            "method": record.method,
            "requestPayload": record.requestPayload,
            "responsePayload": record.responsePayload,
            "ip": record.ip,
            "destIp": "0.0.0.0",
            "time": record.time,
            "statusCode": record.statusCode,
            "type": record.type,
            "status": record.status,
            "akto_account_id": record.akto_account_id,
            "akto_vxlan_id": record.akto_vxlan_id,
            "is_pending": record.is_pending,
            "source": record.source,
            "direction": "",
            "process_id": "",
            "socket_id": "",
            "daemonset_id": "",
            "enabled_graph": "",
            "tag": "",
            "publishToGuardrails": false
        };
        ngx.log(ngx.INFO, "akto ingest record: " + ingestRecord);
        return ingestRecord;
    });
    ngx.fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "batchData": ingestList })
    }).then(function(resp) {
        if (resp.ok) {
            ngx.log(ngx.INFO, "akto batch send success: HTTP " + resp.status);
        } else {
            ngx.log(ngx.WARN, "akto batch send failed: HTTP " + resp.status);
        }
        return resp.text();
    }).then(function(body) {
        ngx.log(ngx.INFO, "akto service response: " + body);
    }).catch(function(e) {
        ngx.log(ngx.WARN, "akto batch send error: " + e);
    });
}

export default { addToBatch, flushBatch };
