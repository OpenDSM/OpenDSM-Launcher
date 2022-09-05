LoadElements()

if (!user.git.isDeveloperAccount) {
    $("#submit-product").attr('controller', '')
    $("#submit-product").attr('name', '')
    $("#submit-product").on('click', () => {
        new ActivateDeveloperAccountPopup().open();
    })
}

async function LoadElements() {
    LoadCarouselItem("latest")
    LoadCarouselItem("popular")
}

async function LoadCarouselItem(type) {
    let element = $(`#${type}-products.carousel`)[0];
    let response = await APICall("product", "", "GET", { type, page: 0, count: 10 });
    if (response.ok) {
        let json = await response.json();
        json.forEach(async i => {
            $(`#${type}-products.carousel .list.horizontal`)[0].appendChild(await CreateProductElement(i.id))
            element.style.display = "";
        })
        return;
    }
    element.remove();
}