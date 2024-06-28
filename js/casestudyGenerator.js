var modalElement;
var myModal;

window.onload = window.onpageshow = function () {
    if (window.location.href.includes("#modal")) {
        showCaseStudy(true);
    } else {
        hideCaseStudy(true);
    }
};

window.onpopstate = function () {
    if (window.location.href.includes("#modal")) {
        showCaseStudy(true);
    } else {
        if(modalElement != null)
        hideCaseStudy(true);
    }
};



function showCaseStudy(quiet = false){
    showCaseStudy(window.location.href.split("#modal-")[1], quiet)
}

function showCaseStudy(casestudy, quiet = false) {
    
    if (myModal == null) {
        modalElement = document.getElementById('modal-boy');
        myModal = new bootstrap.Modal(modalElement);
    }
    
    modalElement.addEventListener('hidden.bs.modal', hideCaseStudyEvent)
    
    if (myModal._isShown) { return; }
    
    if (!window.location.href.includes("#modal") && !quiet) {
        history.pushState(null, "", window.location.href + "#modal-" + casestudy);
    } 
    
    document.title = "Pip Turner - Modal"
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
    console.log("load cs")

    // Load the portfolio items, sorted by year
    loadCaseStudiesJSON(function (items) {
        
        
        document.getElementById('casestudies').innerHTML += `
        <div class="container-fluid py-2 row">
            <div class="d-flex flex-col flex-wrap overflow-auto justify-content-center card-deck" id="casestudies-items">

            </div>
        </div>
        `;
        
        var caseStudies = ""
        // Loop through all items
        for (var i = 0; i < items.length; i++) {

            var image = "";
            image = `<img class="ccard-img-top" src="../images/casestudies/${items[i].image}" alt="${items[i].imageAlt}"></img>`;
            

            //Generate the card using the above info

            var caseStudyCard = `
                <div class="card ccard-casestudy" onclick="showCaseStudy(\'${items[i].title}\')">
                        ${image}
                        <div class="ccard-body shadow ">
                            <p class="ccard-title">${items[i].title}</p>
                            <p class="ccard-company">${items[i].company}</p>
                            <p class="ccard-text">${items[i].description}</p>
                        </div> 
                </div>  
            `

            caseStudies += caseStudyCard;
        }
        document.getElementById(`casestudies-items`).innerHTML = caseStudies;
    });
}

loadCaseStudiesData();