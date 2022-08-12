FROM nginx:latest

COPY nginx-default.conf.template /etc/nginx/conf.d/default.conf.template

COPY ./start.sh /
# ENTRYPOINT ["/docker-entrypoint.sh"]

RUN chmod 766 /start.sh 
CMD ["/start.sh"]
