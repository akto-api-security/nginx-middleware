
sample nginx-conf for nginx with akto-data-ingestion service [ No kafka module needed, only njs module req. ]:

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
    js_shared_dict_zone zone=tempData:1M timeout=60s evict;
    js_shared_dict_zone zone=counter:1M type=number;
    js_shared_dict_zone zone=sampleRateCounter:256K type=number;
    js_import main2 from api_log_2.js;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       80;
        server_name  localhost;
        location / {
            js_body_filter main2.to_lower_case buffer_type=buffer;
            # sample application
            proxy_pass   http://juiceshop:3000;
            mirror      /mirror_request;
            mirror_request_body off;
        }

        location /mirror_request {
            internal;
            js_content   main2.call_http;
        }

        location /akto_api_url {
            internal;
            # akto data-ingestion service IP
            proxy_pass http://10.191.56.198:9000/api/ingestData;
            proxy_method      POST;
            proxy_set_header accept "application/json";
            proxy_set_header Content-Type "application/json";
        }
    }
}
```
