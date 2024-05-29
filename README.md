# 应用原型WebGME-DSS
WebGME Dynamic Systems Studio is a web-based collaborative framework for
composing and simulating cyber-physical systems expressed as
[Modelica](https://www.modelica.org/) models. The framework is built on
top [WebGME](https://webgme.org) that provides a git-like centralized model storage where each
change is efficiently stored as commit inside a [mongodb database](https://www.mongodb.com/).

[OpenModelica](https://openmodelica.org/).


## 使用 docker-compose 启动应用程序

克隆仓库:
```
git clone https://github.com/webgme/webgme-dss.git
```

构建镜像并启动容器:
```
docker-compose up -d
```

## 开发者（主 前端）

#### 环境依赖
nodejs v14.21.3
npm v6.14.17

#### 构建并启动应用部分功能
克隆仓库:
```
git clone https://github.com/webgme/webgme-dss.git
```

接下来安装 node_modules（在 `package.json`中定义为依赖项）.
```
npm install
```

构建前端服务
```
npm run webpack
```

在默认端口（27017）本地启动 mongod，默认情况下，模型将放在 `multi` 中，可以在 `./config/config.default.js`中进行配置。

windows (example)
```
"C:\Program Files\<mongodb>\bin\mongod" --dbpath "C:\dirToStoreFiles"
```

linux/macOS
```
mongodb --dbpath <dirToStoreFiles>
```

运行mongodb后启动server
```
npm start
```

（默认为 localhost:8888）

### Creating the Modelica Seed
 1. Follow the instructions in /scripts/py_modelica_exporter/README.md to generate `components.json`
 2. From `src/common/` run `node preprocessComponents.js` (it consumes `components.json` from step one)
    - If the PortMapping does not exist - the `ModelicaBaseSeed` and `metadata.json` need to be updated
 3. Create a project from the ModelicaBaseSeed name it e.g. `SeedProject`
 4. From root of repo run: `node node_modules\webgme-engine\src\bin\run_plugin.js SeedCreator SeedProject`
