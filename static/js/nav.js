const bar = document.getElementById("indic-nav")

function delay(event, time){
    event.preventDefault();
    setTimeout(() => {
        window.location.href = event.target.attributes.href.nodeValue;
    }, time);
}

function nav_bar(e){
    items.forEach(el => {
        el.classList.remove("actif");
        el.removeAttribute("style");
    })
    
    bar.style.width = e.offsetWidth + "px";
    bar.style.left = e.offsetLeft + "px";
    e.classList.add("actif")
}


items = document.querySelectorAll('.nav')
items.forEach(element=> {
        element.addEventListener("click", e => {
            nav_bar(e.target)
        })
});

window.addEventListener("resize", function(){   
    nav_bar(document.getElementsByClassName("actif")[0])
})

