const { ipcRenderer } = require('electron');
var user = null;
var page = null;
LoadWindowDecoration()
async function LoadPageElements() {
    Array.from($("partial")).forEach(async partial => {
        let controller = $(partial).attr('controller')
        let name = $(partial).attr('name')
        let url = `html/${controller}/${name}.html`
        let html = await $.get(url)
        partial.outerHTML = html;
    })
    let action = setInterval(() => {
        if (Array.from($("partial")).length == 0) {
            clearInterval(action);
            Array.from($("action")).forEach(action => {
                let controller = $(action).attr('controller')
                let name = $(action).attr('name')
                $(action).on('click', async () => {
                    await Navigate(controller, name)

                    $("#popup")[0].classList.remove('active')
                    $("body")[0].classList.remove('popup-active')
                    setTimeout(() => {
                        $("#popup .content")[0].innerHTML = "";
                    }, 500)

                    $("body")[0].style.overflow = ""
                })
            })
        }
    }, 500)

}

async function Navigate(controller, name) {
    let loading = new LoadingScreen(`Loading...`, "")
    let url = `html/${controller}/${name}.html`
    page = {controller: controller, name: name, url: url}
    if (!await IsLoggedIn()) {
        url = `html/Auth/login.html`
        page = {controller: "Auth", name: "login", url: url}
    }
    console.log(`navigating to ${JSON.stringify(page)}`)
    await $("main").load(url);
    await LoadPageElements();
    setTimeout(() => {
        InitElements();
    }, 500)
    loading.unload();
}

async function LoadWindowDecoration() {
    let html = await $.get(`html/_SHARED_/window.html`);
    $("body")[0].innerHTML = html + $("body")[0].innerHTML;

    $("#close-btn").on('click', () => ipcRenderer.send("closeApp"))
    $("#max-btn").on('click', () => ipcRenderer.send("maximizeApp"))
    $("#min-btn").on('click', () => ipcRenderer.send("setCookies"))

    Navigate("home", "index");
}

async function IsLoggedIn() {
    if (user != null) return true;
    let cookies = await ipcRenderer.invoke("getCookies", {});
    if (cookies.length == 0) return false;
    let email = "";
    let token = "";
    cookies.forEach(cookie => {
        if (cookie.name == "auth_email") {
            email = cookie.value;
        }
        if (cookie.name == "auth_token") {
            token = cookie.value;
        }
    })
    if (email != "" && token != "") {
        let data = new FormData();
        data.append('username', email);
        data.append('password', token);
        try {
            let response = await fetch('http://opendsm.tk/api/auth/login?useToken=true', { method: "POST", body: data })
            if (response.ok) {
                let json = await response.json();
                if (json.success) {
                    user = json.user;
                    return true;
                }
            }
        } catch {
        }
    }

    return false;
}

function ProfileImage(){
    return `data:image/jpeg;base64,${user.images.profile}`
}
function BannerImage(){
    return `data:image/jpeg;base64,${user.images.banner}`
}