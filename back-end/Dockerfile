FROM node:22-slim
WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./.npmrc ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    npm install -g pnpm@11.10.0 && \
    pnpm install
COPY ./src ./src
COPY ./jobDescription.txt ./jobDescription.txt
CMD pnpm dev resumes/ && pnpm query jobDescription.txt 2