/**
 * 启动vite
 */
const vscode = require("vscode");
// const exec = require("child_process").exec;
const vite = require("vite");
const open = require("open");
const fs = require("fs");
const path = require("path");

let relativePath = "/index.html";
let server = null;

module.exports = function (context) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.vite.viteLaunch",
      async function (uri) {
        // 工程目录
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const root = workspaceFolder.uri.fsPath;
        // const root = "D:\\llbt\\ant-design-pro-vue";

        if (uri) {
          relativePath = uri.fsPath.substring(root.length);
        }
        const options = {
          root: root,
          port: 3000,
        };

        // 读取配置文件
        // const userConfig = await vite.resolveConfig('development', root)

        // if (Array.isArray(userConfig.configureServer)) {
        //   userConfig.configureServer.unshift(myPlugin)
        // } else if (userConfig.configureServer) {
        //   userConfig.configureServer = [myPlugin, userConfig.configureServer]
        // } else {
        //   userConfig.configureServer = [myPlugin]
        // }

        const userConfig = {
          configureServer: [myPlugin],
          root,
          port: 5550,
          relativePath,
        };
        // userConfig.configureServer = [myPlugin];
        // userConfig.root = root;
        // userConfig.port = 5550;

        if (!server || !server.listening) {
          server = runServe(userConfig);
        }

        statusBarItem.text = `$(debug-pause) vite: ${userConfig.port}`;
        statusBarItem.command = "extension.vite.viteClose";

        if (relativePath.endsWith(".js") || relativePath.endsWith(".vue")) {
          open(`http://localhost:${port}/index.html`);
        } else {
          open(`http://localhost:${port}${relativePath}`);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.vite.viteClose", function () {
      statusBarItem.text = `closing`;
      statusBarItem.command = null;
      server &&
        server.close(() => {
          vscode.window.showInformationMessage("vite is closed");
          statusBarItem.text = `$(debug-start) vite  `;
          statusBarItem.command = "extension.vite.viteLaunch";
        });
    })
  );

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = `$(debug-start) vite`;
  statusBarItem.command = "extension.vite.viteLaunch";
  context.subscriptions.push(statusBarItem);

  statusBarItem.show();
};

function runServe(options) {
  const server = vite.createServer(options);

  let port = options.port || 3000;

  server.on("error", (e) => {
    // @ts-ignore
    if (e.code === "EADDRINUSE") {
      console.log(`Port ${port} is in use, trying another one...`);
      setTimeout(() => {
        server.close();
        server.listen(++port);
      }, 100);
    } else {
      console.error(e);
    }
  });

  server.listen(port, () => {
    console.log(`Dev server running at: ${port}`);
  });

  return server;
}

const myPlugin = (ctx) => {
  const app = ctx.app;

  if (relativePath.endsWith(".js")) {
    app.use((context, next) => {
      const {
        request: { url, query },
      } = context;
      if (url == "/" || url == "/index.html") {
        const p = path.resolve(__dirname, "./index.html");

        let content = fs.readFileSync(p, "utf-8");
        const newContent = content.replace("./src/main.js", relativePath);
        context.body = newContent;
      }
      next();
    });
  } else if (relativePath.endsWith(".vue")) {
    app.use((context, next) => {
      const {
        request: { url, query },
      } = context;
      if (url == "/" || url == "/index.html") {
        const p = path.resolve(__dirname, "./index.html");
        let content = fs.readFileSync(p, "utf-8");
        context.body = content;
      } else if (url == "/src/main.js") {
        const p = path.resolve(__dirname, "./main.js");
        let content = fs.readFileSync(p, "utf-8");
        const newContent = content.replace("./App.vue", relativePath);
        context.type = "application/javascript";
        context.body = newContent;
      }
      next();
    });
  }
};
