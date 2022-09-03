var personal = Object.keys(page.args).length == 0;
var id = Number.parseInt(personal ? user.id : page.args.id)
var pageUser = null;
InitElementValues()
async function LoadSettings() {
    let personalSection = $("section#personal")[0];
    let html = await $.get('html/auth/profile-sections/personal-section.html');
    personalSection.innerHTML = html;
    // Username
    $("#username-box")[0].placeholder = user.username;
    $("#about-box")[0].value = user.about
    $("#dev-btn")[0].innerText = user.git.isDeveloperAccount ? "Create Product" : "Activate Developer Account"
    $("#dev-btn").on('click', () => {
        if (user.git.isDeveloperAccount) {
            Navigate("Product", "create");
        } else {
            new ActivateDeveloperAccountPopup().open()
        }
    })
    $("#upload-profile-image")[0].style.background = `transparent`
    $("#upload-profile-banner")[0].style.background = `transparent`
    $("#upload-profile-banner")[0].style.backgroundImage = $("#landing.profile")[0].style.backgroundImage = `url('${BannerImage()}')`
    $("#upload-profile-image")[0].style.backgroundImage = $("#landing .profile-image")[0].style.backgroundImage = `url('${ProfileImage()}')`

    if (user.git.hasGitReadme) {
        $("toggle#use-git-about")[0].style.display = "";
        $("#use-git-about").on('click', e => {
            let value = $(e.currentTarget).attr('value') != "true";
            $("#about-box")[0].disabled = value;
            $("#save-profile-btn")[0].disabled = false;
            $(e.currentTarget).attr("modified", "")
            loadAbout(value)
        })
    }

    $("#use-git-about").attr('value', user.git.useReadme)

    $("#logout-btn").on('click', () => {
        user = null;
        ipcRenderer.send("setCookies", { name: "auth_email", value: "", path: "/", url: host, expirationDate: new Date("2000").toUTCString() })
        ipcRenderer.send("setCookies", { name: "auth_token", value: "", path: "/", url: host, expirationDate: new Date("2000").toUTCString() })
        Navigate("auth", "login")
    })

    $("#save-profile-btn").on('click', async () => {
        $("#save-profile-btn")[0].disabled = true;
        Array.from($("[setting][modified]")).forEach(async e => {
            let name = $(e).attr('setting');
            let value = e.value == null ? $(e).attr("value") : e.value;
            let data = new FormData();
            data.append("name", name);
            data.append("value", value);
            let loading = new LoadingScreen("Saving...")
            await APICall("auth", "settings", "PATCH", null, data)
            
            $(e).removeAttr("modified")
            loading.unload();
        })
    })
    $("#about-box").on('keyup', e => {
        updateAbout(e.currentTarget.value)
    })
    $("[setting]").on('keyup', e => {
        $("#save-profile-btn")[0].disabled = false;
        if (e.key == "Enter") {
            $("#save-profile-btn")[0].click();
        }
        $(e.currentTarget).attr("modified", "")
    })

    $("#upload-profile-image.file-upload").on('click', e => {
        let input = document.createElement('input');
        input.type = "file"
        input.accept = "image/*";
        $(input).on('change', l => {
            let file = l.currentTarget.files[0];
            let popup = new ImagePopup(e.currentTarget, file, 1 / 1, true, async base => {
                let data = new FormData();
                data.append("base64", base);
                let loading = new LoadingScreen("Uploading Profile");
                await fetch(`${host}/api/auth/image/profile`, { method: "POST", body: data })
                let response = await APICall("auth", "image/profile", "POST", null, data)
                if (response.ok()) {

                }
                Array.from($(".profile-image")).forEach(item => {
                    item.style.backgroundImage = `url("data:image/png;base64,${base}")`
                })
                loading.unload();
            });
            popup.open();
        })
        input.click();
    })

    $("#upload-profile-banner.file-upload").on('click', e => {
        let input = document.createElement('input');
        input.type = "file"
        input.accept = "image/*";
        $(input).on('change', l => {
            let file = l.currentTarget.files[0];
            let popup = new ImagePopup(e.currentTarget, file, 16 / 3.6667, false, async base => {
                let data = new FormData();
                data.append("base64", base);
                let loading = new LoadingScreen("Uploading Banner");
                await fetch(`${host}/api/auth/image/banner`, { method: "POST", body: data })
                $(".profile#landing")[0].style.backgroundImage = `url("data:image/png;base64,${base}")`
                loading.unload();
            });
            popup.open();
        })
        input.click();
    })

}
async function LoadAnalytics() {
    if (user.createdProducts.length != 0) {
        let analSection = $("section#analytics")[0];
        let html = await $.get('html/auth/profile-sections/analytics.html');
        analSection.innerHTML = html;
        analSection.style.display = "";
    }
}
async function InitElementValues() {

    if (personal) {
        pageUser = user;
        LoadSettings();
        LoadAnalytics();
    } else {
        let response = await fetch(`${host}/api/auth/user?id=${id}`);
        if (response.ok) {
            let json = await response.json();
            pageUser = json;
        }
        $("#landing.profile")[0].style.backgroundImage = `url('${BannerImage(pageUser)}')`
        $("#landing .profile-image")[0].style.backgroundImage = `url('${ProfileImage(pageUser)}')`
        $("#landing.profile")[0].style.backgroundImage = `url('${BannerImage(pageUser)}')`
        $("#landing .profile-image")[0].style.backgroundImage = `url('${ProfileImage(pageUser)}')`
    }
    $(".name.profile-name")[0].innerText = pageUser.username

    if (pageUser.git.useReadme)
        updateAbout(pageUser.git.readme)
    else
        updateAbout(pageUser.about)
    $("#latest-products-carousel")[0].style.display = "none";
    if (pageUser.createdProducts.length != 0) {
        for (let i = 0; i < pageUser.createdProducts.length; i++) {
            if (i > 10) break;
            $("#latest-products")[0].appendChild(await CreateProductElement(pageUser.createdProducts[i]));
        }
        $("#latest-products-carousel")[0].style.display = "";
    }
}

function updateAbout(html) {
    let converter = new showdown.Converter()
    $("#about-rendering")[0].innerHTML = converter.makeHtml(html);
}
async function loadAbout(git) {
    $("#about-rendering")[0].innerHTML = "";
    let response;
    if (git)
        response = await fetch(`${host}/api/auth/readme/${user.id}?git=true`)
    else
        response = await fetch(`${host}/api/auth/readme/${user.id}`)
    if (response.ok) {
        let json = await response.json();
        let value = json.about;
        updateAbout(value);
        $("#about-box")[0].disabled = git
    }
}
