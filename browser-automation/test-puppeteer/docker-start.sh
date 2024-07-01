# Build the Docker image
docker build -t test-puppeteer .

# Run the Docker container
docker run -i --init --cap-add=SYS_ADMIN --rm test-puppeteer node -e "$(cat main.js)"