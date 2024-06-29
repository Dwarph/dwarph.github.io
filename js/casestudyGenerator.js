var modalElement;
var myModal;
var caseStudies;

loadCaseStudiesData();


window.onload = window.onpageshow = function () {
    if (window.location.href.includes("#modal")) {
        showCaseStudyInURL(true);
    } else {
        hideCaseStudy(true);
    }
};

window.onpopstate = function () {
    if (window.location.href.includes("#modal")) {
        showCaseStudyInURL(true);
    } else {
        if(modalElement != null)
        hideCaseStudy(true);
    }
};



function showCaseStudyInURL(quiet){
    showCaseStudy(window.location.href.split("#modal-")[1], quiet)
}

function showCaseStudy(casestudy, quiet) {
    
    if (myModal == null) {
        modalElement = document.getElementById('modal-boy');
        myModal = new bootstrap.Modal(modalElement);
    }
    
    modalElement.addEventListener('hidden.bs.modal', hideCaseStudyEvent)
    
    if (myModal._isShown) { return; }
    var caseStudy = undefined;

    for (var i = 0; i < caseStudies.length; i++) {
        if(caseStudies[i].key == casestudy){
            caseStudy = caseStudies[i];
            break;
        }
    }

    if(caseStudy == undefined) { 
        console.log("attempted to show case study that was not loaded");
        return;}

    
    if (!window.location.href.includes("#modal") && !quiet) {
        history.pushState(null, "", window.location.href + "#modal-" + casestudy);
    } 
    
    var converter = new showdown.Converter();
    
    document.getElementsByClassName("modal-body")[0].innerHTML= converter.makeHtml(caseStudy.md);

    document.getElementsByClassName("modal-title")[0].innerHTML = caseStudy.title;
    document.title = `Pip Turner - ${caseStudy.title}`
    myModal.show();
}

function hideCaseStudyEvent(event){
    hideCaseStudy();
}

function hideCaseStudy(quiet = false) {
    if (myModal == null) { return; }

    if (!quiet) {
        history.pushState(null, "", window.location.href.replace("#modal-" + window.location.href.split("#modal-")[1], ""));
    }

    modalElement.removeEventListener('hidden.bs.modal', hideCaseStudyEvent)

    document.title = "Pip Turner"
    myModal.hide();
}

function loadCaseStudiesJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../data/caseStudiesData.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

function loadCaseStudiesData() {
    // Load the portfolio items, sorted by year
    loadCaseStudiesJSON(function (items) {
        document.getElementById('casestudies').innerHTML += `
        <div class="container-fluid py-2 row">
            <div class="d-flex flex-col flex-wrap overflow-auto justify-content-center card-deck" id="casestudies-items">

            </div>
        </div>
        `;
        caseStudies = items;
        var caseStudyCards = ""
        // Loop through all items
        for (var i = 0; i < items.length; i++) {

            loadMarkdownFile(function(markdown){

                var index = Number(markdown[0])
                markdown = markdown.substring(1, markdown.length-1)
                caseStudies[index].md = markdown;
            }, i)

            var image = "";
            image = `<img class="ccard-img-top" src="../images/casestudies/${items[i].image}" alt="${items[i].imageAlt}"></img>`;
            

            //Generate the card using the above info

            var caseStudyCard = `
                <div class="card ccard-casestudy" onclick="showCaseStudy(\'${items[i].key}\', false)">
                        ${image}
                        <div class="ccard-body shadow ">
                            <p class="ccard-title">${items[i].title}</p>
                            <p class="ccard-company">${items[i].company}</p>
                            <p class="ccard-text">${items[i].description}</p>
                        </div> 
                </div>  
            `

            caseStudyCards += caseStudyCard;
        }
        document.getElementById(`casestudies-items`).innerHTML = caseStudyCards;
    });
}

function loadMarkdownFile(callback, index) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../data/casestudies/' + caseStudies[index].md, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(("" + index) + xobj.responseText);
        }
    };
    xobj.send(null);
}
