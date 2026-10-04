// Work + Projects views: the item model behind the List and Grid views.
// Built from the same data the homepage already renders (homepageData.json), plus the
// case study index (years) and the Interaction Archive entries. Fetched once, on load for
// the default Grid (or a List link), or when someone on Featured reaches for the switcher.

(function () {
    function slug(text) {
        return String(text).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function isExternal(url) {
        return /^https?:\/\//i.test(url || '');
    }

    function isVideo(src) {
        return /\.(mp4|webm)(\?|#|$)/i.test(src || '');
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Descriptions carry a little HTML (<br>, <a>). richText keeps a safe subset for the
    // detail card; plainText flattens it for list rows, which are links themselves.
    var RICH_TAGS = { A: 1, BR: 1, EM: 1, STRONG: 1, I: 1, B: 1 };

    function cleanNode(parent) {
        var kids = Array.prototype.slice.call(parent.childNodes);
        for (var i = 0; i < kids.length; i++) {
            var n = kids[i];
            if (n.nodeType === 3) continue;
            if (n.nodeType !== 1) { n.remove(); continue; }
            cleanNode(n);
            if (!RICH_TAGS[n.tagName]) {
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

    function yearFromCompanyLine(line) {
        var m = /(\d{4})/.exec(line || '');
        return m ? Number(m[1]) : null;
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

    function buildWorkItems(home, caseStudyMeta, archive) {
        var items = [];
        for (var i = 0; i < home.work.length; i++) {
            var job = home.work[i];
            var entries = (job.caseStudies || []).concat(job.otherWork || []);
            for (var j = 0; j < entries.length; j++) {
                var cs = entries[j];
                var meta = cs.key ? caseStudyMeta[cs.key] : null;
                var href = cs.comingSoon ? null : (cs.link || (cs.key ? cs.key + '.html' : null));
                var external = isExternal(href);
                var hasPage = !!(meta && !cs.link);
                var isArchivePage = cs.link === 'interaction-archive.html';
                var year = meta ? yearFromCompanyLine(meta.company) : null;
                items.push({
                    id: 'w-' + (cs.key || slug(cs.title)),
                    section: 'work',
                    title: cs.title,
                    category: cs.tags || '',
                    short: cs.short || '',
                    lead: cs.description || '',
                    year: year,
                    yearLabel: year ? String(year) : job.dates,
                    company: job.company,
                    gradient: job.gradientColor || null,
                    employer: employerOf(job),
                    href: href,
                    external: external,
                    comingSoon: cs.comingSoon === true,
                    kind: hasPage ? 'case-study' : (isArchivePage ? 'archive-page' : (external ? 'external' : 'page')),
                    // `type` in the data names the kind of work; otherwise it's derived.
                    typeLabel: cs.type || (hasPage ? 'Case study' : (isArchivePage ? 'Interaction' : (external ? 'External' : 'Page'))),
                    ctaLabel: cs.comingSoon ? 'Coming soon' : (hasPage ? 'Case study' : 'View'),
                    hero: cs.hero === true,
                    media: [{ src: cs.image, type: 'image', alt: cs.imageAlt || '', role: 'cover' }]
                });
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

    // An archive entry that is also a case study (Dog Racer) shows once, as the case
    // study, with the archive loop as its cover.
    function findTwin(items, entry) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].kind === 'case-study' && slug(items[i].title) === slug(entry.title)) return items[i];
        }
        return null;
    }

    function mergeArchiveInto(caseStudy, entry) {
        var oldCover = caseStudy.media[0];
        var loop = Object.assign({}, entry.media[0], { role: 'cover' });
        if (!loop.alt) loop.alt = oldCover.alt;
        caseStudy.media[0] = loop;
    }

    function buildArchiveItem(p, job) {
        var src = 'images/projects/' + p.image;
        var poster = p.imageMob ? 'images/projects/' + p.imageMob : null;
        var link = p.links && p.links[0] ? p.links[0].link : 'interaction-archive.html';
        return {
            id: 'a-' + slug(p.title),
            section: 'work',
            title: p.title,
            category: (p.tags || []).join(', '),
            short: p.short || '',
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
            typeLabel: p.type || 'Interaction',
            ctaLabel: 'View',
            sourceHref: 'interaction-archive.html',
            hero: p.hero === true,
            media: [{
                src: src,
                poster: isVideo(src) ? poster : null,
                type: isVideo(src) ? 'video' : 'image',
                alt: p.imageAlt || '',
                role: 'cover'
            }]
        };
    }

    function buildProjectItems(home) {
        return home.projects.map(function (p) {
            return {
                id: 'p-' + slug(p.title),
                section: 'projects',
                title: p.title,
                category: p.tags || '',
                short: p.short || '',
                lead: p.lead || p.description || '',
                year: p.year,
                yearLabel: String(p.year),
                company: 'Personal',
                gradient: null,
                employer: null,
                href: p.link || null,
                external: isExternal(p.link),
                comingSoon: false,
                kind: 'project',
                tier: p.tier,
                typeLabel: p.type || (p.tier === 'major' ? 'Product' : 'Experiment'),
                ctaLabel: p.banner && p.banner.cta ? p.banner.cta : 'View',
                brand: p.banner ? p.banner.brand : null,
                ink: p.banner ? p.banner.ink : null,
                // Major projects are heroes unless the data says otherwise.
                hero: typeof p.hero === 'boolean' ? p.hero : p.tier === 'major',
                // `thumb`: an optional tighter crop for small surfaces (list thumb, grid tile)
                // when the subject is tiny in the full image (Set Sail's boat).
                media: [{ src: p.image, thumb: p.thumb || null, type: isVideo(p.image) ? 'video' : 'image', alt: p.imageAlt || '', role: 'cover' }]
            };
        });
    }

    function fetchJson(url) {
        return new Promise(function (resolve, reject) {
            window.fetchJsonWithRetry(url, resolve, reject);
        });
    }

    var pending = null;

    // home: the homepageData.json object the page already loaded.
    window.loadWorkViewsData = function (home) {
        if (pending) return pending;
        pending = Promise.all([
            fetchJson('data/caseStudiesData.json'),
            fetchJson('data/projectsData.json')
        ]).then(function (res) {
            var caseStudyMeta = {};
            for (var i = 0; i < res[0].length; i++) caseStudyMeta[res[0][i].key] = res[0][i];
            return {
                work: buildWorkItems(home, caseStudyMeta, res[1]),
                projects: buildProjectItems(home)
            };
        });
        pending.catch(function () { pending = null; });
        return pending;
    };

    window.WorkViewsUtil = {
        slug: slug,
        isVideo: isVideo,
        escapeHtml: escapeHtml,
        richText: richText,
        plainText: plainText
    };
})();
