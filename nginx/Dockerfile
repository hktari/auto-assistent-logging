FROM nginx:latest

COPY ./nginx-default.conf.template /etc/nginx/conf.d/default.conf.template

COPY ./docker-entrypoint.sh /
RUN chmod 766 /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
