var yearsDict = {};

// Mobile detection is now in utils.js

function loadProjectsJSON(callback) {
    fetch('../data/projectsData.json')
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(function(data) {
            callback(data);
        })
        .catch(function(error) {
            console.error('Error loading projects data:', error);
        });
}


function loadProjectsData() {
    // Load the portfolio items, sorted by year
    loadProjectsJSON(function (items) {
        items.sort(function (a, b) {
            return b.year - a.year;
        });

        var years = [];
        var tags = [];

        yearsDict["all"] = "";
        yearsDict["featured"] = "";

        var yearSelector = document.getElementById("year-selector");
        var featuredOption = document.createElement("option");
        featuredOption.text = "🌟";
        featuredOption.value = "featured";
        yearSelector.add(featuredOption);

        var allOption = document.createElement("option");
        allOption.text = "All";
        allOption.value = "all";
        yearSelector.add(allOption);

        document.getElementById('portfolio').innerHTML += `
        <div class="container-fluid py-2 row">
            <div class="d-flex flex-col flex-wrap overflow-auto justify-content-center card-deck" id="portfolio-items">

            </div>
        </div>
        `;

        var isMobile = window.mobileCheck();


        // Loop through all items
        for (var i = 0; i < items.length; i++) {
            // If we haven't generated a year "card" for the item yet, generate that first
            if (!years.includes(items[i].year)) {
                years.push(items[i].year);
                yearsDict[items[i].year] = "";

                var option = document.createElement("option");
                option.text = items[i].year;
                option.value = items[i].year;
                yearSelector.add(option);
            }

            var cardMeta = "";

            //Sort the tag list on an item alphabetically
            items[i].tags.sort();
            //Generate the tag list string & card metadata
            var tagList = "[";
            for (var j = 0; j < items[i].tags.length; j++) {
                cardMeta += items[i].tags[j] + ", ";
                tagList += "\"" + items[i].tags[j] + "\", ";

                if (!tags.includes(items[i].tags[j]) && items[i].tags[j] != "*") {
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

            var re = /(?:\.([^.]+))?$/;
            var ext = re.exec(items[i].image)[1];

            var image = "";

            if (isMobile){
                image = `<img class="card-img-top-${items[i].importance}" src="../images/projects/${items[i].imageMob}" alt="${items[i].imageAlt}" loading="lazy" width="288" height="288"></img>`;
            }
            else{
                if (ext == "mp4") {
                    image = `<video class="card-img-top-${items[i].importance}" width="288" height="288" autoplay muted loop playsinline preload="none">
                    <source src="../images/projects/${items[i].image}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`;
                } else {
                    image = `<img class="card-img-top-${items[i].importance}" src="../images/projects/${items[i].image}" alt="${items[i].imageAlt}" loading="lazy" width="288" height="288"></img>`;
                }
            }
            
            var mobileTransition = "";

            if (isMobile){
                mobileTransition = "no-transition"
            }

            //Generate the card using the above info

            var portfolioCard = `
                <div class="mt-5 card-portfolio-parent" data-tagList=${items[i].tags} data-year=${items[i].year}>
                    <div class="card card-portfolio-${items[i].importance} ${mobileTransition}">
                        ${image}
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

            if(items[i].featured){
                yearsDict["featured"] += portfolioCard;
            }
        }
        yearSelector.options[0].setAttribute('selected', 'selected');
        document.getElementById(`portfolio-items`).innerHTML = yearsDict[document.getElementById(`year-selector`).value];

        if(isMobile){
            document.getElementsByClassName("ccard-hello")[0].classList+= " no-transition";
        }
    });
}

function checkAlert(evt) {
    document.getElementById(`portfolio-items`).classList.add('pre-animation');

    setTimeout(function () {
        document.getElementById(`portfolio-items`).innerHTML = yearsDict[evt.target.value];
        document.getElementById(`portfolio-items`).classList.remove('pre-animation');
    }, 500);
}
loadProjectsData();