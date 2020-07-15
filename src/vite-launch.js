/**
 * 启动vite
 */
const vscode = require('vscode');
const exec = require('child_process').exec;
const vite = require('vite')


module.exports = function (context) {
  let server = null;
  context.subscriptions.push(vscode.commands.registerCommand('extension.vite.viteLaunch', function (uri) {
    // 工程目录
    const workspaceFolder = vscode.workspace.workspaceFolders[0]
    const workspacePath = workspaceFolder.uri.path
    let relativePath = '/index.html'
    if (uri) {
      relativePath = uri.path.substring(workspacePath.length)
    }

    const options = {
      root: workspacePath,
      port: 3000
    }

    if (!server || !server.listening) {
      server = runServe(options)
    }

    statusBarItem.text = `$(debug-pause) vite: ${options.port}`
    statusBarItem.command = 'extension.vite.viteClose'

    exec(`open http://localhost:${options.port}${relativePath}`)
  }))


  context.subscriptions.push(vscode.commands.registerCommand('extension.vite.viteClose', function () {
    statusBarItem.text = `closing`
    statusBarItem.command = null
    server && server.close(() => {
      vscode.window.showInformationMessage('vite is closed')
      statusBarItem.text = `$(debug-start) vite  `
      statusBarItem.command = 'extension.vite.viteLaunch'
    })
  }))


  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.text = `$(debug-start) vite`
  statusBarItem.command = 'extension.vite.viteLaunch'
  context.subscriptions.push(statusBarItem)

  statusBarItem.show();
}

function runServe(options) {
  const server = vite.createServer(options)

  let port = options.port || 3000
  let hostname = options.hostname || 'localhost'
  const protocol = options.https ? 'https' : 'http'

  server.on('error', (e) => {
    // @ts-ignore
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying another one...`)
      setTimeout(() => {
        server.close()
        server.listen(++port)
      }, 100)
    } else {
      console.error(e)
    }
  })

  server.listen(port, () => {
    console.log(`Dev server running at: ${port}`)
  })

  return server
}

