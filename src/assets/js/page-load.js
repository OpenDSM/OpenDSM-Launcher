const { ipcRenderer } = require('electron');
const env = require('../../environment');
const host = "http://localhost:8080";
var user = null;
var page = null;
if (env.isWindows)
    LoadWindowDecoration()
Navigate("home", "index");
setInterval(() => {
    Array.from($("a")).forEach(a => {
        if ($(a).attr('extern') == null) {
            $(a).attr('extern', a.href)
            a.href = "#";
            $(a).on('click', e => {
                e.preventDefault();
                new OpenExternalLinkPopup($(a).attr('extern')).open();
            })
        }
    })
}, 1000)
async function LoadPageElements() {
    Array.from($("partial")).forEach(async partial => {
        let controller = $(partial).attr('controller').toLowerCase();
        let name = $(partial).attr('name').toLowerCase();
        let url = `html/${controller}/${name}.html`
        let html = await $.get(url)
        partial.outerHTML = html;
    })
    let action = setInterval(() => {
        if (Array.from($("partial")).length == 0) {
            clearInterval(action);
            Array.from($("action")).forEach(action => {
                let controller = $(action).attr('controller').toLowerCase();
                let name = $(action).attr('name').toLowerCase();
                if (controller != "" && controller != null) {
                    let clickHandler = async () => {
                        await Navigate(controller, name)

                        $("#popup")[0].classList.remove('active')
                        $("body")[0].classList.remove('popup-active')
                        setTimeout(() => {
                            $("#popup .content")[0].innerHTML = "";
                        }, 500)

                        $("body")[0].style.overflow = ""
                    }
                    $(action).unbind("click")
                    $(action).on('click', clickHandler);
                }
            })
        }
    }, 500)

}
async function Reload() {
    let controller = page.controller == null ? "home" : page.controller;
    let name = page.name == null ? "index" : page.name;
    let args = page.args == null ? {} : page.args;
    await Navigate(controller, name, args);
}
async function Navigate(controller, name, args = {}) {
    controller = controller.toLowerCase();
    name = name.toLowerCase();

    let loading = new LoadingScreen(`Loading...`)
    let url = `html/${controller}/${name}.html`
    page = { controller: controller, name: name, url, args }

    if (!await IsLoggedIn()) {
        url = `html/auth/login.html`
        page = { controller: "auth", name: "login", url, args }
        await $("main").load(url);
        await LoadPageElements();
        setTimeout(() => {
            InitElements();
            $("#hamburger-menu-item")[0].style.display = "none";
        }, 500)
        loading.unload();
    } else {
        await $("main").load(url);
        await LoadPageElements();
        window.scrollTo(0,0);
        setTimeout(() => {
            InitElements();
            $("#hamburger-menu-item")[0].style.display = "";
        }, 500)
        loading.unload();
    }
}

async function LoadWindowDecoration() {
    let html = await $.get(`html/_shared_/window.html`);
    $("body")[0].innerHTML = html + $("body")[0].innerHTML;

    $("#close-btn").on('click', () => ipcRenderer.send("closeApp"))
    $("#max-btn").on('click', () => ipcRenderer.send("maximizeApp"))
    $("#min-btn").on('click', () => ipcRenderer.send("setCookies"))
}

async function IsLoggedIn() {
    if (user != null) return true;
    return await RelogUser();
}

async function RelogUser() {
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
            let response = await fetch(`${host}/api/auth/login?useToken=true`, { method: "POST", body: data })
            if (response.ok) {
                let json = await response.json();
                if (json.success) {
                    response = await fetch(`${host}/api/auth/user?id=${json.user.id}&includeImages=true`)
                    if (response.ok) {
                        json = await response.json();
                        user = json;
                    }
                    return true;
                }
            }
        } catch {
        }
    }

    return false;
}

function ProfileImage(u = user) {
    return `data:${u.images.profile.mime};base64,${u.images.profile.base64}`
}
function BannerImage(u = user) {
    return `data:${u.images.banner.mime};base64,${u.images.banner.base64}`
}

ipcRenderer.on('navigate', (event, arg) => {
    Navigate(arg.controller, arg.name, arg.args)
})


async function CreateProductElement(id) {
    let response = await APICall("product", id);
    if (response.ok) {
        let json = await response.json();

        let product = document.createElement('div')
        product.classList.add('product', 'lg');

        let banner = document.createElement('img');
        banner.src = `${host}/product/${id}/images/banner`;

        let content = document.createElement('div');
        content.classList.add('content');

        let name = document.createElement('h4');
        name.classList.add('name');
        name.innerText = json.name;

        let author = document.createElement('div');
        
        author.innerText = json.user.name;
        $(author).on('click', () => {
            Navigate("auth", "profile", { id: json.user.id })
        })

        let platforms = document.createElement("span");
        platforms.classList.add('platforms')
        Array.from(json.platforms).forEach(platform => {
            platforms.appendChild(getPlatformIcon(platform));
        })


        let navigateAction = () => {
            Navigate("product", "index", { id: id })
        }
        $(banner).on('click', navigateAction)
        $(name).on('click', navigateAction)

        content.appendChild(name)
        content.appendChild(author)
        content.appendChild(platforms);
        product.appendChild(banner)
        product.appendChild(content);

        return product;
    }
}

function getPlatformIcon(platform) {
    let icon = document.createElement('i')
    switch (platform) {
        case 0:
            // Windows
            icon.classList.add("fab", "fa-windows")
            break;
        case 1:
            // Mac OS
            icon.classList.add("fab", "fa-apple")
            break;
        case 2:
            //Linux
            icon.classList.add("fab", "fa-linux")
            break;
        case 3:
            // Windows ARM
            icon.style.backgroundImage = `url('images/icons/windows-arm-brands.svg')`
            break;
        case 4:
            // MacOS ARM
            icon.style.backgroundImage = `url('images/icons/apple-arm-brands.svg')`
            break;
        case 5:
            // Linux ARM
            icon.style.backgroundImage = `url('images/icons/linux-arm-brands.svg')`
            break;
        case 6:
            // Android
            icon.style.backgroundImage = `url('images/icons/android-brands.svg')`
            break;
        case 7:
            // Java
            icon.classList.add("fa-brands", "fa-java")
            break;
    }
    return icon;
}


async function APICall(controller, page = "", http_method = "GET", parameters = {}, data = new FormData()) {
    http_method = http_method.toUpperCase();
    let url = `${host}/api/${controller}/${page}`
    if (parameters != null && Object.keys(parameters).length != 0) {
        for (let i = 0; i < Object.keys(parameters).length; i++) {
            let key = Object.keys(parameters)[i];
            let value = Object.values(parameters)[i];
            let seperator = i == 0 ? "?" : "&";
            url += `${seperator}${key}=${value}`
        }
    }

    let headers = new Headers();
    if (IsLoggedIn) {
        let email;
        let token;
        let cookies = await ipcRenderer.invoke("getCookies", {});
        cookies.forEach(cookie => {
            if (cookie.name == "auth_email") {
                email = cookie.value;
            }
            if (cookie.name == "auth_token") {
                token = cookie.value;
            }
        })
        headers.append("auth_user", `${email}`)
        headers.append("auth_token", `${token}`)
    }

    url = encodeURI(url);
    let http_options
    if (data != null && Array.from(data).length > 0 && http_method.toLowerCase() != "get" && http_method.toLowerCase() != "head") {
        http_options = {
            method: http_method,
            headers: headers,
            body: data
        }
    } else {
        http_options = {
            method: http_method,
            headers: headers
        }
    }

    return await fetch(url, http_options)
}