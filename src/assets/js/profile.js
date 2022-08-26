var personal = page.args.length == 0;
var id = Number.parseInt(personal ? user.id : page.args[0].id)
var pageUser = null;
InitElementValues()
async function InitElementValues() {

    if (personal) {
        pageUser = user;
        personalSection = $("section#personal")[0];
        let html = await $.get('html/Auth/profile-sections/personal-section.html');
        personalSection.outerHTML = html;
        if (user.createdProducts.length != 0) {
            analSection = $("section#analytics")[0];
            let html = await $.get('html/Auth/profile-sections/analytics.html');
            analSection.innerHTML = html;
            analSection.style.display = "";
        }
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
        $("#upload-profile-banner")[0].style.backgroundImage = $("#landing.profile")[0].style.backgroundImage = `url('${BannerImage()}')`
        $("#upload-profile-image")[0].style.backgroundImage = $("#landing .profile-image")[0].style.backgroundImage = `url('${ProfileImage()}')`
    } else {
        let response = await fetch(`http://opendsm.tk/api/auth/user?id=${id}&includeImages=true`);
        if(response.ok){
            let json = await response.json();
            pageUser = json;
        }
    }
   $("#landing.profile")[0].style.backgroundImage = `url('data:image/jpeg;base64,${pageUser.images.banner}')`
    $("#landing .profile-image")[0].style.backgroundImage = `url('data:image/jpeg;base64,${pageUser.images.profile}')`

    if (pageUser.git.useReadme)
        updateAbout(pageUser.git.readme)
    else
        updateAbout(pageUser.about)
}



$("#logout-btn").on('click', () => {
    user = null;
    ipcRenderer.send("setCookies", { name: "auth_email", value: "", path: "/", url: "http://opendsm.tk", expirationDate: new Date("2000").toUTCString() })
    ipcRenderer.send("setCookies", { name: "auth_token", value: "", path: "/", url: "http://opendsm.tk", expirationDate: new Date("2000").toUTCString() })
    Navigate("Auth", "login")
})

$("#save-profile-btn").on('click', async () => {
    $("#save-profile-btn")[0].disabled = true;
    Array.from($("[setting][modified]")).forEach(async e => {
        let name = $(e).attr('setting');
        let value = e.value == null ? $(e).attr("value") : e.value;
        let data = new FormData();
        data.append("name", name);
        data.append("value", value);
        data.append("email", email);
        data.append("token", token);
        await fetch("/api/auth/settings", { method: "PATCH", body: data })
        $(e).removeAttr("modified")
    })
})
$("#about-box").on('keyup', e => {
    updateAbout(e.currentTarget.value)
})
function updateAbout(html) {
    let converter = new showdown.Converter()
    $("#about-rendering")[0].innerHTML = converter.makeHtml(html);
}
async function loadAbout(git) {
    $("#about-rendering")[0].innerHTML = "";
    let response;
    if (git)
        response = await fetch(`http://opendsm.tk/api/auth/readme/${user.id}?git=true`)
    else
        response = await fetch(`http://opendsm.tk/api/auth/readme/${user.id}`)
    if (response.ok) {
        let json = await response.json();
        let value = json.about;
        updateAbout(value);
        $("#about-box")[0].disabled = git
    }
}

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
            data.append("email", email);
            data.append("token", token);
            let loading = new LoadingScreen("Uploading Profile", "This may take a moment!");
            await fetch('/http://opendsm.tk/api/auth/image/profile', { method: "POST", body: data })
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
            data.append("email", email);
            data.append("token", token);
            let loading = new LoadingScreen("Uploading Banner", "This may take a moment!");
            await fetch('http://opendsm.tk/api/auth/image/banner', { method: "POST", body: data })
            $(".profile#landing")[0].style.backgroundImage = `url("data:image/png;base64,${base}")`
            loading.unload();
        });
        popup.open();
    })
    input.click();
})

$("#use-git-about").on('click', e => {
    let value = $(e.currentTarget).attr('value') != "true";
    $("#about-box")[0].disabled = value;
    $("#save-profile-btn")[0].disabled = false;
    $(e.currentTarget).attr("modified", "")
    loadAbout(value)
})