// Work views prototype: one normalized item model built from the live data files.
// Nothing here is new content - it reads homepageData.json, projectsData.json,
// caseStudiesData.json and the case study markdown, so every view shows the same items.

(function () {
    // Prototype defaults for the hero flag. A `"hero": true|false` on the JSON entry wins.
    var DEFAULT_HERO_IDS = {
        'w-early-user-experience': true,
        'w-sidestep-jump-crouch': true,
        'w-prosho': true,
        'a-tabs-pads-and-boards': true,
        'a-aurora': true
    };

    function slug(text) {
        return String(text).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function isExternal(url) {
        return /^https?:\/\//i.test(url || '');
    }

    function isVideo(src) {
        return /\.(mp4|webm)(\?|#|$)/i.test(src || '');
    }

    // Same rewrite as caseStudyPageGenerator.js: markdown paths are written as ./images/... and ./data/...
    function rewritePath(src) {
        return src.replace(/^\.\//, '');
    }

    function yearFromCompanyLine(line) {
        var m = /(\d{4})/.exec(line || '');
        return m ? Number(m[1]) : null;
    }

    function fetchJson(url) {
        return new Promise(function (resolve, reject) {
            window.fetchJsonWithRetry(url, resolve, reject);
        });
    }

    function fetchText(url) {
        return new Promise(function (resolve) {
            window.fetchTextWithRetry(url, resolve, function () { resolve(''); });
        });
    }

    // Pull every image and video out of a case study's markdown, with whatever alt text it has.
    function extractMarkdownMedia(md) {
        var media = [];
        var imgRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
        var vidRe = /<video[^>]*\ssrc="([^"]+)"[^>]*>/g;
        var found = [];
        var m;
        while ((m = imgRe.exec(md))) {
            found.push({ at: m.index, src: rewritePath(decodeURI(m[2])), alt: m[1].trim(), type: 'image' });
        }
        while ((m = vidRe.exec(md))) {
            // Videos carry no alt; borrow a nearby figcaption or aria-label if there is one.
            var near = md.slice(m.index, m.index + 600);
            var cap = /aria-label="([^"]+)"/.exec(m[0]) || /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/.exec(near);
            found.push({
                at: m.index,
                src: rewritePath(m[1]),
                alt: cap ? cap[1].replace(/<[^>]+>/g, '').trim() : '',
                type: 'video'
            });
        }
        found.sort(function (a, b) { return a.at - b.at; });
        for (var i = 0; i < found.length; i++) {
            media.push({ src: found[i].src, type: found[i].type, alt: found[i].alt, role: 'inline' });
        }
        return media;
    }

    function encodeSrc(src) {
        return encodeURI(src);
    }

    function applyHero(item, raw) {
        item.hero = typeof raw.hero === 'boolean' ? raw.hero : !!DEFAULT_HERO_IDS[item.id];
    }

    function buildWorkItems(home, caseStudyMeta, mdByKey, archive) {
        var items = [];
        for (var i = 0; i < home.work.length; i++) {
            var job = home.work[i];
            var groups = (job.caseStudies || []).concat(job.otherWork || []);
            for (var j = 0; j < groups.length; j++) {
                var cs = groups[j];
                var meta = cs.key ? caseStudyMeta[cs.key] : null;
                var href = cs.link || (cs.key && !cs.comingSoon ? cs.key + '.html' : null);
                if (cs.comingSoon) href = null;
                var external = isExternal(href);
                var hasPage = !!(cs.key && mdByKey[cs.key] !== undefined && !cs.link);
                var item = {
                    id: 'w-' + (cs.key || slug(cs.title)),
                    section: 'work',
                    title: cs.title,
                    category: cs.tags || (meta && meta.description) || '',
                    lead: cs.description || '',
                    year: meta ? yearFromCompanyLine(meta.company) : null,
                    yearLabel: meta ? String(yearFromCompanyLine(meta.company)) : job.dates,
                    company: job.company,
                    gradient: job.gradientColor || null,
                    employer: employerOf(job),
                    href: href,
                    external: external,
                    comingSoon: cs.comingSoon === true,
                    kind: hasPage ? 'case-study' : (cs.link === 'interaction-archive.html' ? 'archive-page' : (external ? 'external' : 'page')),
                    typeLabel: hasPage ? 'Case study' : (cs.link === 'interaction-archive.html' ? 'Interaction' : (external ? 'External' : 'Page')),
                    ctaLabel: cs.comingSoon ? 'Coming soon' : (hasPage ? 'Case study' : 'View'),
                    media: [{ src: cs.image, type: 'image', alt: cs.imageAlt || '', role: 'cover' }]
                };
                if (hasPage && mdByKey[cs.key]) {
                    var inline = extractMarkdownMedia(mdByKey[cs.key]);
                    for (var k = 0; k < inline.length; k++) {
                        // The cover often reappears as the article's first image - skip the duplicate.
                        if (inline[k].src === cs.image) continue;
                        item.media.push(inline[k]);
                    }
                }
                applyHero(item, cs);
                items.push(item);
            }

            // The Interaction Archive is Ultraleap work, so its entries sit with that job.
            if (job.company === 'Ultraleap') {
                for (var a = 0; a < archive.length; a++) {
                    var entry = buildArchiveItem(archive[a], job);
                    var twin = findTwin(items, entry);
                    if (twin) mergeArchiveInto(twin, entry);
                    else items.push(entry);
                }
            }
        }
        return items;
    }

    // The job's intro, as Featured shows it - used by the list's employer intro row.
    function employerOf(job) {
        return {
            company: job.company,
            gradient: job.gradientColor || null,
            logo: job.logo,
            role: job.role,
            dates: job.dates,
            description: job.description
        };
    }

    // An archive entry that is also a case study (Dog Racer) shows once, as the case
    // study. Its loop becomes the cover; the case study's still moves to the extras.
    function findTwin(items, entry) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].kind === 'case-study' && slug(items[i].title) === slug(entry.title)) return items[i];
        }
        return null;
    }

    function mergeArchiveInto(caseStudy, entry) {
        var oldCover = caseStudy.media[0];
        oldCover.role = 'inline';
        var loop = Object.assign({}, entry.media[0], { role: 'cover' });
        if (!loop.alt) loop.alt = oldCover.alt;
        caseStudy.media.splice(0, 1, loop, oldCover);
    }

    function buildArchiveItem(p, job) {
        var src = 'images/projects/' + p.image;
        var poster = p.imageMob ? 'images/projects/' + p.imageMob : null;
        var link = p.links && p.links[0] ? p.links[0].link : 'interaction-archive.html';
        var item = {
            id: 'a-' + slug(p.title),
            section: 'work',
            title: p.title,
            category: (p.tags || []).join(', '),
            lead: p.description || '',
            year: p.year,
            yearLabel: String(p.year),
            company: job.company,
            gradient: job.gradientColor,
            employer: employerOf(job),
            href: link,
            external: isExternal(link),
            comingSoon: false,
            kind: 'archive',
            typeLabel: 'Interaction',
            ctaLabel: 'View',
            sourceHref: 'interaction-archive.html',
            media: [{
                src: src,
                poster: isVideo(src) ? poster : null,
                type: isVideo(src) ? 'video' : 'image',
                alt: p.imageAlt || '',
                role: 'cover'
            }]
        };
        applyHero(item, p);
        return item;
    }

    function buildProjectItems(home) {
        var items = [];
        for (var i = 0; i < home.projects.length; i++) {
            var p = home.projects[i];
            var item = {
                id: 'p-' + slug(p.title),
                section: 'projects',
                title: p.title,
                category: p.tags || '',
                lead: p.lead || p.description || '',
                year: p.year,
                yearLabel: String(p.year),
                company: 'Personal',
                gradient: null,
                href: p.link || null,
                external: isExternal(p.link),
                comingSoon: false,
                kind: 'project',
                tier: p.tier,
                typeLabel: p.tier === 'major' ? 'Product' : 'Experiment',
                ctaLabel: p.banner && p.banner.cta ? p.banner.cta : 'View',
                brand: p.banner ? p.banner.brand : null,
                ink: p.banner ? p.banner.ink : null,
                media: [{ src: p.image, type: isVideo(p.image) ? 'video' : 'image', alt: p.imageAlt || '', role: 'cover' }]
            };
            if (typeof p.hero === 'boolean') item.hero = p.hero;
            else item.hero = p.tier === 'major';
            items.push(item);
        }
        return items;
    }

    // Alt text the detail card will show verbatim - flag the placeholders so they get rewritten.
    function reportWeakAlt(items) {
        var weak = [];
        for (var i = 0; i < items.length; i++) {
            for (var j = 0; j < items[i].media.length; j++) {
                var md = items[i].media[j];
                var alt = (md.alt || '').trim();
                var file = md.src.split('/').pop();
                if (!alt || /^alt text$/i.test(alt) || /(project|case study) image$/i.test(alt) || alt === file) {
                    weak.push({ item: items[i].title, src: md.src, alt: alt || '(empty)' });
                }
            }
        }
        if (weak.length && window.console && console.table) {
            console.info('[work-views] ' + weak.length + ' media with weak alt text (shown in the detail card):');
            console.table(weak);
        }
        return weak;
    }

    window.loadWorkViewsData = function () {
        return Promise.all([
            fetchJson('data/homepageData.json'),
            fetchJson('data/caseStudiesData.json'),
            fetchJson('data/projectsData.json')
        ]).then(function (res) {
            var home = res[0];
            var csList = res[1];
            var archive = res[2];
            var caseStudyMeta = {};
            for (var i = 0; i < csList.length; i++) caseStudyMeta[csList[i].key] = csList[i];

            var keys = Object.keys(caseStudyMeta);
            return Promise.all(keys.map(function (key) {
                return fetchText('data/casestudies/' + caseStudyMeta[key].md);
            })).then(function (mds) {
                var mdByKey = {};
                for (var k = 0; k < keys.length; k++) mdByKey[keys[k]] = mds[k];
                var work = buildWorkItems(home, caseStudyMeta, mdByKey, archive);
                var projects = buildProjectItems(home);
                var all = work.concat(projects);
                for (var n = 0; n < all.length; n++) {
                    for (var m = 0; m < all[n].media.length; m++) {
                        all[n].media[m].src = encodeSrc(all[n].media[m].src);
                        if (all[n].media[m].poster) all[n].media[m].poster = encodeSrc(all[n].media[m].poster);
                    }
                }
                var weakAlt = reportWeakAlt(all);
                return { home: home, items: { work: work, projects: projects }, weakAlt: weakAlt };
            });
        });
    };

    // Descriptions in the data files carry a little HTML (<br>, <a>). richText keeps a safe
    // subset for places that can hold links (the detail card); plainText flattens it for
    // places that can't (list rows, which are themselves links).
    var RICH_TAGS = { A: 1, BR: 1, EM: 1, STRONG: 1, I: 1, B: 1 };

    function cleanNode(parent) {
        var kids = Array.prototype.slice.call(parent.childNodes);
        for (var i = 0; i < kids.length; i++) {
            var n = kids[i];
            if (n.nodeType === 3) continue;
            if (n.nodeType !== 1) { n.remove(); continue; }
            cleanNode(n);
            if (!RICH_TAGS[n.tagName]) {
                // Unknown tag: keep its text, drop the element.
                while (n.firstChild) parent.insertBefore(n.firstChild, n);
                n.remove();
                continue;
            }
            var href = n.tagName === 'A' ? n.getAttribute('href') : null;
            while (n.attributes.length) n.removeAttribute(n.attributes[0].name);
            if (href && /^(https?:\/\/|\/|[\w.-]+\.html)/i.test(href)) {
                n.setAttribute('href', href);
                if (isExternal(href)) {
                    n.setAttribute('target', '_blank');
                    n.setAttribute('rel', 'noopener noreferrer');
                }
            }
        }
    }

    // <template> parses inertly: nothing in it loads or runs.
    function richText(html) {
        var tpl = document.createElement('template');
        tpl.innerHTML = String(html || '');
        cleanNode(tpl.content);
        return tpl.innerHTML.trim();
    }

    function plainText(html) {
        var tpl = document.createElement('template');
        tpl.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, ' ');
        return tpl.content.textContent.replace(/\s+/g, ' ').trim();
    }

    window.WorkViewsUtil = {
        slug: slug,
        isVideo: isVideo,
        richText: richText,
        plainText: plainText,
        escapeHtml: function (s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
    };
})();
