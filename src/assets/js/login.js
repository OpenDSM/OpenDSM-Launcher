
$("#show-password-toggle").on('click', e => {
    try {
        let value = $(e.target).attr('value');
        $("#password")[0].type = value != "true" ? "text" : "password"
        $("#confirm-password")[0].type = value != "true" ? "text" : "password"
    } catch { }
})
$("#login-button").on('click', () => {
    let username = $("#username")[0].value;
    let password = $("#password")[0].value;
    if (username.length > 0 && password.length > 0) {
        Login(username, password)
    } else {
        error("Fields can NOT be left blank")
    }
})
$("#login-form input").on('keyup', e => {
    error("")
    if (e.key == "Enter") {
        e.target.blur();
        $("#login-button")[0].click();
    }
})
function error(message) {
    $(".error")[0].innerHTML = message;
}
async function Login(username, password) {
    error("")
    let data = new FormData();
    data.append('username', username);
    data.append('password', password);
    try {
        let loading = new LoadingScreen("Hold on!", "Were checking some stuff!")
        let response = await fetch('http://opendsm.tk/api/auth/login', { method: "POST", body: data })
        if (response.ok) {
            let json = await response.json();
            if (!json.success) {
                error(json.message)
            } else {
                user = json.user;
                let emailCookie;
                let tokenCookie;

                if ($("#remember-me-toggle").attr('value') == "true") {
                    emailCookie = { name: "auth_email", value: json.user.email + "", path: "/", url: "http://opendsm.tk", expirationDate: new Date("3000").getTime()};
                    tokenCookie = { name: "auth_token", value: json.user.token + "", path: "/", url: "http://opendsm.tk", expirationDate: new Date("3000").getTime() };
                } else {
                    emailCookie = { name: "auth_email", value: json.user.email + "", path: "/", url: "http://opendsm.tk" }
                    tokenCookie = { name: "auth_token", value: json.user.token + "", path: "/", url: "http://opendsm.tk" }
                }
                ipcRenderer.send("setCookies", emailCookie);
                ipcRenderer.send("setCookies", tokenCookie);
                Navigate("Home", "index")
            }
        } else
            error("Unknown Server Error")
        loading.unload();
    } catch {
    }
}