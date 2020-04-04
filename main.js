const {app, BrowserWindow, Notification, ipcMain, nativeTheme} = require('electron');

//创建全局变量，防止被垃圾回收
let win;
function createWindow () {   
  // 创建浏览器窗口
  win = new BrowserWindow({
    width: 250,
    height: 350,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // 加载index.html文件
  win.loadFile('index.html')
  
  // 打开开发者工具
  // win.webContents.openDevTools();
}
// 部分API在ready事件触发后才能使用
app.whenReady().then(()=>{
  createWindow()
  handleIPC();
});

// app.on('window-all-closed', ()=>{
//   //在macOs上，除非用户用cmd + Q 确认退出
//   //否则绝大部分应用及菜单栏会保持激活
//   if(process.platform !== 'darwin') {
//     app.quit();
//   }
// })

// app.on('activate', ()=>{
//   //在macOS上，当点击dock图标并且没有其他窗口打开时，
//   //通常在应用程序中重新创建一个窗口
//   if(BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// })

function handleIPC() {
  ipcMain.handle('work-notification', async (e, {body, title, actions, closeButtonText}) => {
    let res = await new Promise((resolve, reject) => {
      let notification = new Notification({
        title,
        body,
        actions,
        closeButtonText
      })

      notification.show();
      notification.on('action', (event) => {
        resolve({event: 'action'});
      })
      notification.on('close', (event) => {
        resolve({event: 'close'})
      })
    })
    return res;
  })
}