const { app, BrowserWindow, ipcRenderer, ipcMain, session } = require('electron');
const { builtinModules } = require('module');
const path = require('path')


var win;
function createWindow() {
     win = new BrowserWindow({
        height: 720,
        width: 1280,
        minHeight: 720,
        minWidth: 1280,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            devTools: true,
            preload: path.join(__dirname, "preload.js")
        },
        icon: path.join(__dirname, 'assets', "images", "icons", 'logo.png'),
        title: 'OpenDSM',
        frame: false        
    });
    

    win.setTitle('OpenDSM');
    win.setMenu(null);
    win.loadFile(path.join(__dirname, 'assets', "html", 'index.html'));
    win.webContents.on('before-input-event', (event, input)=>{
        if(input.control && input.shift && input.key.toLowerCase() === 'i'){
            event.preventDefault();
            win.openDevTools();
        }
    })
}

app.whenReady().then(createWindow).then(ipcFunctions);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        ipcFunctions();
    }
});

function ipcFunctions() {
    ipcMain.on("closeApp", () => {
        win.close();
    })
    ipcMain.on("minimizeApp", () => {
        win.minimize();
    })
    ipcMain.on("maximizeApp", () => {
        console.log("fdasfadsf")
        
        if (!win.isMaximized())
            win.maximize();
        else
            win.unmaximize();
    })
    ipcMain.on("openDevtools", () => {
        win.openDevTools();
    })

    ipcMain.handle("getCookies", async (event, arg)=>{
        return await session.defaultSession.cookies.get(arg)

    })

    
    ipcMain.on("setCookies", (event, arg) => {
        session.defaultSession.cookies.set(arg)
    })

    // ipcMain.on("setCookies", (event, arg) => {
    //     console.log("fdasfadsf")
    //     console.log(arg)
    //     // session.defaultSession.cookies.set(arg).then(e=>console.log(e))
    //     return true;
    // })


}