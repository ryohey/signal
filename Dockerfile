ARG NODE_VERSION=lts-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /code

COPY . .
RUN npm install --global corepack@latest && corepack enable
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile && pnpm build

FROM node:${NODE_VERSION} AS runner

WORKDIR /web

RUN --mount=type=cache,target=/root/.npm npm install -global serve@latest

COPY --from=builder /code/dist .

EXPOSE 3000

CMD [ "serve" ]
