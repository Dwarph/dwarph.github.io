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

var darkRadioButton = document.getElementById("themeRadioDark");
var whiteRadioButton = document.getElementById("themeRadioWhite");
var yellowRadioButton = document.getElementById("themeRadioYellow");

darkRadioButton.addEventListener('input', setThemeButton);
whiteRadioButton.addEventListener('input', setThemeButton);
yellowRadioButton.addEventListener('input', setThemeButton);
initialThemeSet();


function initialThemeSet() {
    var theme = localStorage.getItem("theme");

    if (theme == null) {
        setTheme("yellow")
    }
    else {
        setTheme(theme);
    }

    if (theme == "yellow") {
        yellowRadioButton.checked = true
    } else if (theme == "dark") {
        darkRadioButton.checked = true
    } else if (theme == "white") {
        whiteRadioButton.checked = true
    }
}

function setThemeButton(button) {
    setTheme(button.target.value);
}

function setTheme(theme) {
    localStorage.setItem("theme", theme);

    document.getElementById(`portfolio-container`).classList.add('pre-animation');

    setTimeout(function () {
        document.documentElement.className = theme;
        setTimeout(function () {
            document.getElementById(`portfolio-container`).classList.remove('pre-animation');
        }, 500);
    }, 500);
}

function setThemeInstant(theme) {
    localStorage.setItem("theme", theme);
    document.documentElement.className = theme;
}