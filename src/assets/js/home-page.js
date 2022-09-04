async function LoadElements() {
    LoadCarouselItem("latest")
    LoadCarouselItem("popular")
}

async function LoadCarouselItem(type) {
    let element = $(`#${type}-products.carousel`)[0];
    let response = await APICall("product", type, "GET", { page: 0, count: 10 });
    if (response.ok) {
        let json = await response.json();
        let jarray = Array.from(json);
        if (jarray.length != 0) {
            for (let i = jarray.length; i == 0; i--) {
                element.appendChild(CreateProductElement(jarray[i].id))
                element.style.display = "";
                return;
            }
        }
    }
    element.remove();
}