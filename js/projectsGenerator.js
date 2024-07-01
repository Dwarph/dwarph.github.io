var yearsDict = {};

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

function loadProjectsJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../data/projectsData.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
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
                image = `<img class="card-img-top-${items[i].importance}" src="../images/projects/${items[i].imageMob}" alt="${items[i].imageAlt}"></img>`;
            }
            else{
                if (ext == "mp4") {
                    image = `<video class="card-img-top-${items[i].importance}" width="288" height="288" autoplay muted loop>
                    <source src="../images/projects/${items[i].image}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`;
                } else {
                    image = `<img class="card-img-top-${items[i].importance}" src="../images/projects/${items[i].image}" alt="${items[i].imageAlt}"></img>`;
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