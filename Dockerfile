## build runner
FROM node:lts-alpine3.16 as build-runner

# Set temp directory
WORKDIR /tmp/app

# Move package.json & yarn.lock
COPY package.json .
COPY yarn.lock .

# Install dependencies
RUN yarn

# Move source files
COPY src ./src
COPY tsconfig.json .

# Build project
RUN yarn run build

## producation runner
FROM node:lts-alpine3.16 as prod-runner

# Set work directory
WORKDIR /app

# Copy package.json from build-runner
COPY --from=build-runner /tmp/app/package.json /app/package.json

# Install dependencies
RUN yarn install --production

# Move build files
COPY --from=build-runner /tmp/app/build /app/build

# Move source files
COPY prisma ./prisma
COPY .env .

# Generate prisma client
RUN yarn run prisma generate

# Start bot
CMD [ "yarn", "run", "start" ]
