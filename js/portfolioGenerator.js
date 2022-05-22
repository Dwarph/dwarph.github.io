function loadJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../data/portfolioData.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

var yearsDict = {};

function loadPortfolioData() {
    // Load the portfolio items, sorted by year
    loadJSON(function (items) {
        items.sort(function (a, b) {
            return b.year - a.year;
        });
        
        var years = [];
        var tags = [];
        
        yearsDict["all"] ="";
        document.getElementById('portfolio').innerHTML += `
        <div class="container-fluid py-2 row">
            <div class="d-flex flex-col flex-wrap overflow-auto justify-content-center card-deck" id="portfolio-items">

            </div>
        </div>
        `;

        // Loop through all items
        for (var i = 0; i < items.length; i++) {
            // If we haven't generated a year "card" for the item yet, generate that first
            if (!years.includes(items[i].year)) {
                years.push(items[i].year);
                yearsDict[items[i].year] = "";
            }

            var cardMeta = "";

            //Sort the tag list on an item alphabetically
            items[i].tags.sort();
            //Generate the tag list string & card metadata
            var tagList = "[";
            for (var j = 0; j < items[i].tags.length; j++) {
                cardMeta += items[i].tags[j] + ", ";
                tagList += "\"" + items[i].tags[j] + "\", ";

                if (!tags.includes(items[i].tags[j])) {
                    tags.push(items[i].tags[j]);
                }
            }

            // Remove unnecessary chars from end of meta & tag list
            cardMeta = cardMeta.slice(0, -2);

            tagList = tagList.slice(0, -1);
            tagList += "\"";

            //Generate list of links for the card
            var links = "";
            if (items[i].links != undefined) {
                for (var j = 0; j < items[i].links.length; j++) {
                    links += `
                <p class="card-text">
                ${items[i].links[j].text} <a href=\"${items[i].links[j].link}\">here</a>
                </p>
                `;
                }
            }

            //Generate the card using the above info

            var portfolioCard = `
                <div class="mt-5 card-portfolio-parent" data-tagList=${items[i].tags} data-year=${items[i].year}>
                    <div class="card card-portfolio">
                        <img class="card-img-top" src="../images/${items[i].image}" alt="${items[i].imageAlt}">
                        <div class="card-body">
                            <p class="card-title">${items[i].title}</p>
                            <p class="card-year">${items[i].year},</p>
                            <p class="card-meta">${cardMeta}</p>
                            <p class="card-text">${items[i].description}</p>
                            ${links}
                        </div> 
                    </div>
                </div>  
            `

            yearsDict[items[i].year] += portfolioCard;
                yearsDict["all"] += portfolioCard;
        }
        document.getElementById(`portfolio-items`).innerHTML = yearsDict[document.getElementById(`year-selector`).value];
    });
}

function checkAlert(evt) {
    document.getElementById(`portfolio-items`).classList.add('pre-animation');

    setTimeout(function () {
        document.getElementById(`portfolio-items`).innerHTML = yearsDict[evt.target.value];
        document.getElementById(`portfolio-items`).classList.remove('pre-animation');
    }, 500);
}

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

loadPortfolioData();
//loadAllContent();
