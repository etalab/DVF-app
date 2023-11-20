DOCKER_COMPOSE_FILE=dockercompose.yml

docker-compose -f ${DOCKER_COMPOSE_FILE} down
docker-compose -f ${DOCKER_COMPOSE_FILE} build
docker-compose -f ${DOCKER_COMPOSE_FILE} up -d
