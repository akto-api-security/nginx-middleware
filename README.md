Nginx Kafka Module

Install dependencies
----
    apt-get install libnginx-mod-http-lua
    wget https://nginx.org/download/nginx-1.14.0.tar.gz && tar -zxvf nginx-1.14.0.tar.gz
    apt-get install libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libxslt-dev libgd-dev libgeoip-dev


    git clone https://github.com/edenhill/librdkafka
    cd librdkafka
    ./configure
    make
    sudo make install
    export LD_LIBRARY_PATH=/usr/local/lib/

Compilation
----

Compile this module into nginx

    git clone ...

    # cd /path/to/nginx
    ./configure  --with-cc-opt='-g -O2 -fdebug-prefix-map=/build/nginx-H4cN7P/nginx-1.14.0=. -fstack-protector-strong -Wformat -Werror=format-security -fPIC -Wdate-time -D_FORTIFY_SOURCE=2' --with-ld-opt='-Wl,-Bsymbolic-functions -Wl,-z,relro -Wl,-z,now -fPIC' --prefix=/usr/share/nginx --conf-path=/etc/nginx/nginx.conf --http-log-path=/var/log/nginx/access.log --error-log-path=/var/log/nginx/error.log --lock-path=/var/lock/nginx.lock --pid-path=/run/nginx.pid --modules-path=/usr/lib/nginx/modules --http-client-body-temp-path=/var/lib/nginx/body --http-fastcgi-temp-path=/var/lib/nginx/fastcgi --http-proxy-temp-path=/var/lib/nginx/proxy --http-scgi-temp-path=/var/lib/nginx/scgi --http-uwsgi-temp-path=/var/lib/nginx/uwsgi --with-debug --with-pcre-jit --with-http_ssl_module --with-http_stub_status_module --with-http_realip_module --with-http_auth_request_module --with-http_v2_module --with-http_dav_module --with-http_slice_module --with-threads --with-http_addition_module --with-http_geoip_module=dynamic --with-http_gunzip_module --with-http_gzip_static_module --with-http_image_filter_module=dynamic --with-http_sub_module --with-http_xslt_module=dynamic --with-stream=dynamic --with-stream_ssl_module --with-mail=dynamic --with-mail_ssl_module --add-dynamic-module=../ngx_kafka_module && make modules && cp objs/ngx_http_kafka_module.so /etc/nginx/modules/


Nginx Configuration
----

Add the code to nginx conf file as follows

    http {

        # some other configs
        log_format bodylog '$remote_addr - $remote_user [$time_local] '
            '"$request" $status $body_bytes_sent '
            '"$http_referer" "$http_user_agent" $request_time '
            '\n\n"$req_headers" \n"$req_body" \n>"$resp_body"';

        kafka;

        kafka_broker_list 127.0.0.1:9092; # host:port ...

        server {
            access_log  /var/log/nginx/server.log bodylog;

            lua_need_request_body on;

            set $resp_body "";
            set $req_body "";
            set $req_headers "";

            client_body_buffer_size 16k;
            client_max_body_size 16k;

            rewrite_by_lua_block {
                local req_headers = "Headers: ";
                ngx.var.req_body = ngx.req.get_body_data();
                local h, err = ngx.req.get_headers()
                for k, v in pairs(h) do
                    req_headers = req_headers .. k .. ": " .. v .. "\n";
                end

                ngx.var.req_headers = req_headers;
            }

            body_filter_by_lua '
            local resp_body = string.sub(ngx.arg[1], 1, 1000)
            ngx.ctx.buffered = (ngx.ctx.buffered or "") .. resp_body
            if ngx.arg[2] then
              ngx.var.resp_body = ngx.ctx.buffered
            end
            ';

        }
    }

At the very beginning of /etc/nginx/nginx.conf add,
    
    load_module /usr/lib/nginx/modules/ndk_http_module.so;
    load_module /usr/lib/nginx/modules/ngx_http_lua_module.so;
    load_module /etc/nginx/modules/ngx_http_kafka_module.so;

After that you can use the module by just executing `nginx -c /path/to/nginx.conf -s reload`. Or you can do `nginx -s stop && nginx`.

