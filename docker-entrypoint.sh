#!/bin/sh

# 替换nginx配置中的环境变量
envsubst '${OPENAI_API_KEY} ${OPENAI_API_BASE_URL} ${ZHIPU_API_KEY} ${BAIDU_API_KEY} ${BAIDU_SECRET_KEY} ${ALIYUN_WANX_KEY} ${ALIYUN_WANX_BASE_URL} ${VOLCENGINE_KEY} ${ARK_API_KEY} ${GEMINI_API_KEY} ${MINIMAX_API_KEY} ${PROXY_URL}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

# 执行传入的命令
exec "$@"
