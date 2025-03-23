import type { JSONPatchTypes, UltraPatchTypes } from "../dist";
import * as UltraPatch from "../dist";

function repeatObject<T>(amount: number, obj: T): T[] {
  const arr = [];
  for (let i = 0; i < amount; i++) arr.push(structuredClone(obj));
  return arr;
}

interface OriginDiffDestBundle<ID extends string> {
  id: ID;
  name: string;
  origin: UltraPatchTypes.Diffable;
  diff: JSONPatchTypes.Operation[];
  destination: UltraPatchTypes.Diffable;
}
function createBundle<ID extends string, T extends UltraPatchTypes.Diffable>(
  id: ID,
  name: string,
  origin: T,
  change: UltraPatchTypes.Diffable | ((v: T) => UltraPatchTypes.Diffable),
): OriginDiffDestBundle<ID> {
  const destination =
    typeof change === "function" ? change(structuredClone(origin)) : change;
  const diff = UltraPatch.diff(origin, destination);
  return {
    id,
    name,
    origin,
    diff,
    destination,
  };
}

export const dataSets = [
  createBundle("simple", "Simple", [4, 3, 2], [5, undefined]),
  createBundle(
    "complicated",
    "Complicated",
    {
      a: 1,
      b: "2",
      c: true,
      d: null,
      e: { nested: { key: "value" } },
      f: ["apple", "banana", "cherry"],
      g: [10, 20, 30],
      h: { deep: { a: "b" } },
    },
    {
      a: 100,
      b: "newString",
      e: { nested: { key: "newValue" } },
      f: ["apple", "blueberry", "cherry", "date"],
      g: [10, 30],
      h: { deep: { x: "old" }, newKey: "newData" },
      i: [{ id: 1 }, { id: 2 }, { id: 3 }],
      j: "addedKey",
    },
  ),
  createBundle(
    "randomgame",
    "Random 2000 players game, x/y positions moving (big flat array)",
    repeatObject(1000, {
      id: "test-player",
      x: 0,
      y: 0,
    }),
    (v) => {
      return v.map((entry) => ({
        id: entry.id,
        x: 1 + Math.floor(Math.random() * 100),
        y: 1 + Math.floor(Math.random() * 100),
      }));
    },
  ),
  // copied from https://github.com/nestjs/nest/blob/master/package.json
  createBundle(
    "bignested",
    "10x NestJS package.json, removing scripts and adding 2 fake dependencies to each",
    repeatObject(10, {
      name: "@nestjs/core",
      version: "11.0.10",
      description: "Modern, fast, powerful node.js web framework",
      homepage: "https://nestjs.com",
      repository: {
        type: "git",
        url: "https://github.com/nestjs/nest.git",
      },
      funding: {
        type: "opencollective",
        url: "https://opencollective.com/nest",
      },
      license: "MIT",
      author: "Kamil Mysliwiec",
      scripts: {
        build: "tsc -b -v packages",
        postbuild: "npm run move:node_modules",
        "build:dev": "tsc -b -v packages --watch",
        "prebuild:prod": "npm run clean",
        "build:prod": "tsc -b -v packages",
        changelog: "lerna-changelog",
        clean: "tsc -b --clean packages",
        "move:samples": "gulp move:samples",
        "move:node_modules": "gulp move:node_modules",
        "build:samples":
          "gulp install:samples && npm run build && npm run move:samples && gulp build:samples && gulp test:samples && gulp test:e2e:samples",
        "codechecks:benchmarks":
          "codechecks ./tools/benchmarks/check-benchmarks.ts",
        coverage: "nyc report --reporter=text-lcov | coveralls -v",
        format:
          'prettier "**/*.ts" "packages/**/*.json" --ignore-path ./.prettierignore --write && git status',
        postinstall: "opencollective",
        test: "mocha packages/**/*.spec.ts",
        "test:dev": 'mocha -w --watch-files "packages" packages/**/*.spec.ts',
        "pretest:cov": "npm run clean",
        "test:cov": "nyc mocha packages/**/*.spec.ts --reporter spec",
        "test:integration":
          'mocha --reporter-option maxDiffSize=0 "integration/*/{,!(node_modules)/**/}/*.spec.ts"',
        "test:docker:up":
          "docker-compose -f integration/docker-compose.yml up -d",
        "test:docker:down":
          "docker-compose -f integration/docker-compose.yml down",
        lint: "concurrently 'npm run lint:packages' 'npm run lint:integration' 'npm run lint:spec'",
        "lint:fix":
          "concurrently 'npm run lint:packages -- --fix' 'npm run lint:integration -- --fix' 'npm run lint:spec -- --fix'",
        "lint:integration":
          "node --max-old-space-size=4096 ./node_modules/.bin/eslint 'integration/**/*.ts'",
        "lint:packages":
          "node --max-old-space-size=4096 ./node_modules/.bin/eslint 'packages/**/**.ts' --ignore-pattern 'packages/**/*.spec.ts'",
        "lint:spec":
          "node --max-old-space-size=4096 ./node_modules/.bin/eslint 'packages/**/**.spec.ts'",
        "lint:ci": "concurrently 'npm run lint:packages' 'npm run lint:spec'",
        prerelease: "gulp copy-misc",
        publish:
          'npm run prerelease && npm run build:prod && ./node_modules/.bin/lerna publish --force-publish --access public --exact -m "chore(@nestjs) publish %s release"',
        prepublishOnly: "npm run changelog | pbcopy",
        "publish:beta":
          'npm run prerelease && npm run build:prod && ./node_modules/.bin/lerna publish --npm-tag=beta --access public -m "chore(@nestjs) publish %s release"',
        "publish:next":
          'npm run prerelease && npm run build:prod && ./node_modules/.bin/lerna publish --npm-tag=next --access public --skip-git -m "chore(@nestjs) publish %s release"',
        "publish:rc":
          'npm run prerelease && npm run build:prod && ./node_modules/.bin/lerna publish --npm-tag=rc --access public -m "chore(@nestjs) publish %s release"',
        "publish:test":
          'npm run prerelease && npm run build:prod && ./node_modules/.bin/lerna publish --force-publish --access public --npm-tag=test --skip-git -m "chore(@nestjs) publish %s release"',
        prepare: "husky",
      },
      "lint-staged": {
        "**/*.ts": ["prettier --ignore-path ./.prettierignore --write"],
        "packages/**/*.json": [
          "prettier --ignore-path ./.prettierignore --write",
        ],
      },
      dependencies: {
        "@nuxt/opencollective": "0.4.1",
        ansis: "3.17.0",
        "class-transformer": "0.5.1",
        "class-validator": "0.14.1",
        cors: "2.8.5",
        express: "5.0.1",
        "fast-json-stringify": "6.0.1",
        "fast-safe-stringify": "2.1.1",
        iterare: "1.2.1",
        "object-hash": "3.0.0",
        "path-to-regexp": "8.2.0",
        "reflect-metadata": "0.2.2",
        rxjs: "7.8.2",
        "socket.io": "4.8.1",
        tslib: "2.8.1",
        uid: "2.0.2",
        uuid: "11.1.0",
      },
      devDependencies: {
        "@apollo/server": "4.11.3",
        "@codechecks/client": "0.1.12",
        "@commitlint/cli": "19.8.0",
        "@commitlint/config-angular": "19.8.0",
        "@eslint/eslintrc": "3.3.0",
        "@eslint/js": "9.22.0",
        "@fastify/cors": "11.0.0",
        "@fastify/formbody": "8.0.2",
        "@fastify/middie": "9.0.3",
        "@fastify/multipart": "9.0.3",
        "@fastify/static": "8.1.1",
        "@fastify/view": "11.0.0",
        "@grpc/grpc-js": "1.13.0",
        "@grpc/proto-loader": "0.7.13",
        "@nestjs/apollo": "13.0.3",
        "@nestjs/graphql": "13.0.3",
        "@nestjs/mongoose": "11.0.2",
        "@nestjs/typeorm": "11.0.0",
        "@types/amqplib": "0.10.7",
        "@types/bytes": "3.1.5",
        "@types/chai": "4.3.20",
        "@types/chai-as-promised": "7.1.8",
        "@types/cors": "2.8.17",
        "@types/eslint__js": "8.42.3",
        "@types/express": "5.0.1",
        "@types/gulp": "4.0.17",
        "@types/http-errors": "2.0.4",
        "@types/mocha": "10.0.10",
        "@types/node": "22.13.10",
        "@types/sinon": "17.0.4",
        "@types/supertest": "6.0.2",
        "@types/ws": "8.18.0",
        "amqp-connection-manager": "4.1.14",
        amqplib: "0.10.5",
        artillery: "2.0.22",
        "body-parser": "1.20.3",
        bytes: "3.1.2",
        "cache-manager": "6.4.1",
        "cache-manager-redis-store": "3.0.1",
        chai: "4.5.0",
        "chai-as-promised": "7.1.2",
        "clang-format": "1.8.0",
        concurrently: "9.1.2",
        "conventional-changelog": "6.0.0",
        "core-js": "3.41.0",
        coveralls: "3.1.1",
        "delete-empty": "3.0.0",
        "engine.io-client": "6.6.3",
        eslint: "9.22.0",
        "eslint-config-prettier": "10.1.1",
        "eslint-plugin-import": "2.31.0",
        "eslint-plugin-prettier": "5.2.3",
        eventsource: "3.0.5",
        "fancy-log": "2.0.0",
        fastify: "5.2.1",
        globals: "16.0.0",
        graphql: "16.10.0",
        "graphql-subscriptions": "3.0.0",
        "graphql-tools": "9.0.18",
        gulp: "5.0.0",
        "gulp-clang-format": "1.0.27",
        "gulp-clean": "0.4.0",
        "gulp-sourcemaps": "3.0.0",
        "gulp-typescript": "5.0.1",
        "gulp-watch": "5.0.1",
        "http-errors": "2.0.0",
        husky: "9.1.7",
        "imports-loader": "5.0.0",
        ioredis: "5.6.0",
        "json-loader": "0.5.7",
        kafkajs: "2.2.4",
        lerna: "2.11.0",
        "lerna-changelog": "2.2.0",
        "light-my-request": "6.6.0",
        "lint-staged": "15.5.0",
        "markdown-table": "2.0.0",
        mocha: "11.1.0",
        mongoose: "8.12.1",
        mqtt: "5.10.4",
        multer: "1.4.5-lts.2",
        mysql2: "3.14.0",
        nats: "2.29.3",
        nodemon: "3.1.9",
        nyc: "14.1.1",
        prettier: "3.5.3",
        redis: "4.7.0",
        "rxjs-compat": "6.6.7",
        sinon: "19.0.4",
        "sinon-chai": "3.7.0",
        "socket.io-client": "4.8.1",
        "subscriptions-transport-ws": "0.11.0",
        supertest: "7.1.0",
        "ts-morph": "25.0.1",
        "ts-node": "10.9.2",
        typeorm: "0.3.21",
        typescript: "5.7.3",
        "typescript-eslint": "8.27.0",
        wrk: "1.2.1",
        ws: "8.18.1",
      },
      engines: {
        node: ">= 20",
      },
      collective: {
        type: "opencollective",
        url: "https://opencollective.com/nest",
        donation: {
          text: "Become a partner:",
        },
      },
      changelog: {
        labels: {
          "type: feature :tada:": "Features",
          "type: bug :sob:": "Bug fixes",
          "type: enhancement :wolf:": "Enhancements",
          "type: docs :page_facing_up:": "Docs",
          "type: code style": "Code style tweaks",
          dependencies: "Dependencies",
        },
      },
      nyc: {
        include: ["packages/**/*.ts"],
        exclude: [
          "**/*.js",
          "**/*.d.ts",
          "**/*.spec.ts",
          "packages/**/adapters/*.ts",
          "packages/**/nest-*.ts",
          "packages/**/test/**/*.ts",
          "packages/core/errors/**/*",
          "packages/common/exceptions/*.ts",
          "packages/common/utils/load-package.util.ts",
          "packages/microservices/exceptions/",
          "packages/microservices/microservices-module.ts",
          "packages/core/middleware/middleware-module.ts",
          "packages/core/discovery/discovery-service.ts",
          "packages/core/injector/module-ref.ts",
          "packages/core/injector/instance-links-host.ts",
          "packages/core/helpers/context-id-factory.ts",
          "packages/websockets/socket-module.ts",
          "packages/common/cache/**/*",
          "packages/common/serializer/**/*",
          "packages/common/services/*.ts",
        ],
        extension: [".ts"],
        require: ["ts-node/register"],
        reporter: ["text-summary", "html"],
        sourceMap: true,
        instrument: true,
      },
      mocha: {
        require: [
          "ts-node/register",
          "tsconfig-paths/register",
          "node_modules/reflect-metadata/Reflect.js",
          "hooks/mocha-init-hook.ts",
        ],
        exit: true,
      },
    }),
    (v) => {
      return v.map((entry: any) => {
        delete entry.scripts;
        entry.dependencies["google"] = "https://google.com";
        entry.dependencies["youtube"] = "https://youtube.com";
        return entry;
      });
    },
  ),
] satisfies OriginDiffDestBundle<string>[];

console.table(
  dataSets.map((dataSet) => ({
    "Test Name": dataSet.name,
    "Changes size": dataSet.diff.length,
  })),
);
console.info("Dataset loaded, starting benchmark...\n");
