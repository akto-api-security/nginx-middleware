
sample nginx-conf:

```bash

load_module /etc/nginx/modules/ngx_http_js_module.so;


user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    subrequest_output_buffer_size 8k;
    js_path "/etc/nginx/njs/";
    js_import main2 from api_log.js;
    js_import batchSender from batch_sender.js;

    # URL of the Akto HTTP service to receive API traffic data
    js_var $akto_target_url "http://akto-runtime:9090/api/data";

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       80;
        server_name  localhost;
        location / {
            js_body_filter main2.to_lower_case buffer_type=buffer;
            # Flush batch every 5 seconds (js_periodic must be in location block)
            js_periodic batchSender.flushBatch interval=5s;
            proxy_pass   http://juiceshop:3000;
        }
    }

}
```
