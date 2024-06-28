function toggleTheme(evt) {

    document.getElementById(`portfolio-container`).classList.add('pre-animation');

    setTimeout(function () {
        if (!evt.target.checked) {
            document.documentElement.className = "white";
        } else {
            document.documentElement.className = "yellow";
        }
        setTimeout(function () {
            document.getElementById(`portfolio-container`).classList.remove('pre-animation');
        }, 500);
    }, 500);
}