FROM node:22-slim
WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./.npmrc ./
RUN npm install -g pnpm@10.30.3 && \
    pnpm install --ignore-scripts && \
    pnpm rebuild esbuild protobufjs
COPY ./src ./src
CMD ["pnpm", "dev", "resumes/"]