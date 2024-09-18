
sample nginx-conf:

```bash

load_module /etc/nginx/modules/ngx_http_js_module.so;
load_module /etc/nginx/modules/ngx_http_kafka_log_module.so;


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
    js_var $responseBo "{}";
    js_import main2 from api_log.js;
    kafka_log_kafka_brokers "kafka1:19092";
    kafka_log_kafka_buffer_max_messages 100000;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       80;
        server_name  localhost;
        location / {
            js_body_filter main2.to_lower_case buffer_type=buffer;
            kafka_log kafka:akto.api.logs $responseBo;
            proxy_pass   http://juiceshop:3000;
        }
    }

}
```
