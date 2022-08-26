const { app, BrowserWindow, ipcMain, session, Menu, Tray, safeStorage } = require('electron');
const path = require('path');
const internal = require('stream');


var win;
var tray;
var tray_balloon_seen = false;
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
    win.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            event.preventDefault();
            win.openDevTools();
        }
    })
}
function createTray() {
    tray = new Tray(path.join(__dirname, 'assets', "images", "icons", 'logo.png'));
    let contextMenu = Menu.buildFromTemplate([
        { label: "Open DSM", type: "normal", enabled: false },
        { type: "separator" },
        { label: "Profile", type: "normal", click: () => { win.show(); win.webContents.send('navigate', { controller: "Auth", name: "profile", args: [] }) } },
        { label: "My Library", type: "normal" },
        { label: "Downloads", type: "normal" },
        { type: "separator" },
        { label: "Exit", type: "normal", click: () => { app.quit(); } },
    ])
    tray.setToolTip('OpenDSM');
    tray.setContextMenu(contextMenu);
    tray.addListener("click", () => {
        win.show();
        win.focus();
    })
    session.defaultSession.cookies.get({ name: "tray_balloon_seen" }).then(cookie => {
        if (cookie.length != 0) {
            tray_balloon_seen = cookie[0].value == "true"
        }
    })
}

app.whenReady().then(createWindow).then(ipcFunctions).then(createTray);

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
        win.hide();
        if (!tray_balloon_seen) {
            tray.displayBalloon({
                title: "OpenDSM",
                content: "Minimized to tray",
                icon: path.join(__dirname, 'assets', "images", "icons", 'logo.png'),
                iconType: "custom",
                respectQuietTime: true,
                largeIcon: true,
            })
            session.defaultSession.cookies.set({
                name: "tray_balloon_seen",
                value: "true",
                path: "/",
                url: "http://opendsm.tk",
                expirationDate: new Date("3000").getTime()
            })
            tray_balloon_seen = true;
        }
    })
    ipcMain.on("minimizeApp", () => {
        win.minimize();
    })
    ipcMain.on("maximizeApp", () => {
        if (!win.isMaximized())
            win.maximize();
        else
            win.unmaximize();
    })
    ipcMain.on("openDevtools", () => {
        win.openDevTools();
    })

    ipcMain.handle("getCookies", async (event, arg) => {
        let cookie = await session.defaultSession.cookies.get(arg);
        if(safeStorage.isEncryptionAvailable){
            Array.from(cookie).forEach(i=>{
                if (i.name == "auth_token") {
                    i.value = safeStorage.decryptString(Buffer.from(i.value.split('-')))
                }
            })
        }
        return cookie

    })


    ipcMain.on("setCookies", (event, arg) => {
        if(safeStorage.isEncryptionAvailable){
            if (arg.name == "auth_token") {
                arg.value = safeStorage.encryptString(arg.value).join('-');
            }
        }
        session.defaultSession.cookies.set(arg)
    })
}
