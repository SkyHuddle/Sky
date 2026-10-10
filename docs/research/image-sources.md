# License real esports images, don't scrape them

**No free source gives a CS2 fantasy app real team logos and pro player photos that are both reasonably complete and legally clean.** The only genuinely free, copyright-cleared pool is Wikimedia Commons, reachable through Wikidata, plus the Flickr Creative Commons photos it was largely built from. That pool is thin and dated. Most confirmed CS2 portraits come from 2019 events. Stars such as NiKo, m0NESY and sh1ro did not turn up, and Commons logo files carry doubtful licence claims. Everything else that looks free fails on terms:

- Liquipedia images are hosted under fair use or private permissions that do not pass on to other users.
- HLTV forbids scraping and business use.
- PandaScore's free-tier terms bar public display.
- ESL's free photo portal is editorial-only.
- Team press kits are written for media and partners, not for products.
- Logo APIs push all trademark responsibility onto you.

Even a perfectly licensed CC photo clears only the photographer's copyright. The CC 4.0 licence text itself excludes trademark and publicity rights, so a real player's face or a team's logo still carries publicity, passing-off and trademark exposure, especially in Germany and the UK. The legal baseline favours the app's core: US case law (C.B.C. v. MLBAM) protects fantasy use of player **names and statistics** without a licence. Photos and logos are the risky layer. Since the app already has `teams.logo_url` and `players.portrait_url` slots commented as "licensed", and its research already recommends GRID, the practical answer has three parts:

1. Launch on real names, stats, team names and team colours, keeping the generated crests and illustrated portraits.
2. Negotiate image rights into the GRID contract, and get written permission from teams.
3. Treat Commons as an optional, provenance-tracked supplement, reviewed by a lawyer.

This report is not legal advice, and the user should get a lawyer's view before showing any real logo or face.

A note on evidence: the research environment blocked direct access to Liquipedia, PandaScore, GRID, Wikimedia, Flickr, logo.dev and Brandfetch. Most findings come from search-engine extracts of the cited official pages rather than full reads. Field names and endpoints marked "unverified" below must be checked against live docs before any code relies on them.

## Ranked options: one free pool, several gated routes

The table ranks options by realistic usefulness for this specific app: legal footing first, then coverage, then engineering cost. The "Cost" column separates what is free in cash from what needs a contract.

| Rank | Option | Cost | Licence / terms | Coverage | How to fetch | Attribution | Risk without further permission |
|---|---|---|---|---|---|---|---|
| 1 | **GRID commercial deal with an image clause** | Paid (already planned) | GRID says its rights-holder relationships let its widgets "feature esports teams' logotypes, players, and images"; scope depends on contract | Likely official CS2, LoL and VALORANT teams and players (unconfirmed for third-party UI) | Central Data GraphQL; team logo field name **unverified** | Per contract | Lowest, if the contract covers display in your UI |
| 2 | **Team press kits plus written permission** | Free cash, outreach time | Brand guidelines for "media and partners"; no product licence shown | Logos only: NAVI, Liquid, G2 found (plus Fnatic, Cloud9, PURE); no headshots | Manual download; self-host | As the org specifies | Medium-high without written OK; low with it |
| 3 | **Wikimedia Commons via Wikidata** | Free | Per-file: CC BY, CC BY-SA, PD; copyright only | CS2 photos: s1mple, ZywOo, donk, Twistzz, ropz (mostly 2019, ropz 2023); logos: NAVI, FaZe, Spirit (doubtful) | SPARQL for P18/P154, then Commons `imageinfo` + `extmetadata` | Author, licence and link per image; CC BY-SA crops must stay CC BY-SA | Copyright low; publicity and trademark medium-high |
| 4 | **Flickr CC (Openverse for discovery)** | Free (API key) | CC BY / BY-SA / CC0 / PDM per photo | Hobbyist event shots (e.g. KingOfEsports, IEM Katowice 2019); no organiser CC found | `flickr.photos.search` with `license=`; Openverse `/v1/images` | Same as Commons | Same as Commons |
| 5 | **logo.dev** | Free tier | Trademarks remain with owners; free commercial use needs backlink | Keyed by domain (navi.gg, vitality.gg…); esports coverage **untested** | Token-keyed image URL by domain | Visible "Logos provided by Logo.dev" link | Medium-high (trademark) |
| 6 | **Brandfetch Logo API** | Free | No attribution; must hotlink, may not cache or store | As above, **untested** | Client-ID-keyed URL by domain | None | Medium-high; no-caching conflicts with your CDN |
| 7 | **PandaScore** | Free tier 1,000 req/h | Terms bar public display of subscription data unless plan allows; no image licence found | Team logos broadly; player photos patchy (often null) | `image_url`, `dark_mode_image_url` on `cdn.pandascore.co` | None specified | High on free tier (terms breach) plus trademark/publicity |
| 8 | **ESL FACEIT Group Media Rights** | Paid / permissioned | Free portal editorial-only; product use via licensing platform | Best CS2 event and player photography | Request via EFG platform | "Copyright: [photographer], ESL FACEIT Group" | Low for copyright once licensed; publicity still separate |
| 9 | **Liquipedia LPDB** | Free non-commercial; Enterprise by quote | Text and data CC BY-SA 3.0; images fair-use or per-holder permission | Complete roster data; images not reusable | LPDB API v3, 60 req/h; image fields **unverified** | "Data from Liquipedia, CC BY-SA 3.0" | Use for data and pointers only |

Several options rank below the table because they should not be used at all:

- **HLTV.** It has no API, its terms ban scraping and require a licence for business use, and its photos belong to HLTV or its licensors.
- **English Wikipedia non-free logos.** These rely on fair-use rationales specific to Wikipedia's own use.
- **Fandom esports wikis.** They are CC BY-NC-SA, so non-commercial only.
- **The `lootmarket/esport-team-logos` GitHub repo.** It has no licence and no provenance.
- **Valve Major sticker art.**
- **Riot's official Flickr accounts.** They are all rights reserved.
- **Clearbit's free Logo API.** It was shut down in December 2025.
- **Google's undocumented favicon endpoint.**
- **Simple Icons.** It has no team logos; its "G2" icon is the software-review site, not G2 Esports.
- **Abios, Bayes, SportsDataIO, Sportradar, Bo3.gg, Strafe and esports-api.com.** They publish no free image access. They are sales-led B2B vendors, and image licensing would be negotiated per contract like GRID.

## Commons and Flickr are the only truly free photos, and they are thin

Wikimedia Commons has a parent "Counter-Strike players" category with per-player subcategories. Searches surfaced **categories for s1mple (8 files), ZywOo, donk, Twistzz (about 6) and ropz (3)** ([Commons](https://commons.wikimedia.org/wiki/Category:Counter-Strike_players); [Ropz](https://commons.wikimedia.org/wiki/Category:Ropz)). A typical file is "IEM Katowice 2019 s1mple IMG 1699", credited to "Esports Kingdom" under **CC BY 2.0** and imported from Flickr ([Commons](https://commons.wikimedia.org/wiki/File:IEM_Katowice_2019_s1mple_IMG_1699_(47347470082)_(cropped).jpg)). No category or file turned up for NiKo, m0NESY or sh1ro. Because the search tool may not index everything, that is unconfirmed rather than proven absent.

The pattern is clear: a handful of hobbyist Flickr photographers, not tournament organisers, supply most free CS imagery. Much of it shows 2019 rosters and jerseys. For a Major pool of well over a hundred players, expect Commons to cover a minority of stars and almost no tier-2 players. That estimate is not a measured count. LoL fares slightly better, with Faker photos under CC BY 2.0, CC BY-SA 3.0 and CC BY 3.0, the last taken from a CC-licensed Fomos YouTube video ([Commons](https://commons.wikimedia.org/wiki/File:Faker_2020_LCK_Photoshoot.jpg)). VALORANT pro coverage is close to nil ([Commons](https://commons.wikimedia.org/wiki/File:Valorant_Champions_Los_Angeles_2023.jpg)).

Commons logos are weaker still. **"Natus Vincere logo.png" claims CC BY-SA 4.0 but cites the team's own website as its source.** That is almost certainly not a licence granted by NAVI ([Commons](https://commons.wikimedia.org/wiki/File:Natus_Vincere_logo.png)). FaZe's older logo is tagged public domain as "simple geometry" ([Commons](https://commons.wikimedia.org/wiki/File:Faze_Clan.svg)). Wikipedia's own guidance notes that such logos stay restricted as trademarks "independently of copyright concerns" ([Wikipedia:Logos](https://en.wikipedia.org/wiki/Wikipedia:Logos)). No Commons logos surfaced for Vitality, G2, MOUZ, Astralis or Falcons.

### Fetching from Wikidata and Commons

Programmatic access is a two-step pipeline. The property semantics below are standard, but the queries were not live-tested because the hosts were blocked.

**Step 1: query Wikidata.** Query `https://query.wikidata.org/sparql?format=json` for players by team (P54 member of sports team), with `OPTIONAL { ?p wdt:P18 ?img }` for the portrait and `OPTIONAL { ?team wdt:P154 ?logo }` for team logos. Values come back as `Special:FilePath/<name>` URLs.

**Step 2: get licence and author from Commons.** Call `https://commons.wikimedia.org/w/api.php?action=query&titles=File:<name>&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=512&iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Credit|AttributionRequired|Restrictions&format=json`. The CommonsMetadata extension supplies `Artist`, `LicenseShortName` and `LicenseUrl`, and `Artist` arrives as HTML that must be stripped ([MediaWiki](https://www.mediawiki.org/wiki/Extension:CommonsMetadata/en); [Openverse handbook](https://make.wordpress.org/openverse/handbook/openverse-catalog/provider-api-wikimedia-commons/)).

**Filtering and storage.** Allow-list licences to CC0, public domain, CC BY and CC BY-SA. Store the `Restrictions` value: it flags `personality` and `trademarked`. Send a descriptive User-Agent.

**Bulk discovery.** A bulk alternative walks `generator=categorymembers` from `Category:Counter-Strike_players`. Only commons.wikimedia.org is queried, so Wikipedia's local non-free logos are excluded automatically.

### Attribution and share-alike

Commons requires crediting the author and identifying the licence. **CC BY-SA adaptations must themselves be shared under CC BY-SA** ([Commons reuse licences](https://c.enwp.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses)). Cropping a CC BY-SA photo into a circular avatar likely creates such an adaptation. That obligation attaches to the cropped image, not to the app. The app needs a per-image credit reachable from where the image appears, such as an info icon or credits sheet.

### Flickr and Openverse

Flickr is the upstream source for most of these images. **No evidence was found that ESL, BLAST, PGL or Riot publish under Creative Commons.** Riot's LoL and VALORANT Flickr photos are marked "All rights reserved" ([Flickr lolesports](https://www.flickr.com/photos/lolesports/52479783522)). ESL's roughly 108,000-photo account showed no licence information in extracts, so check it per photo ([Flickr ESL](https://www.flickr.com/photos/eslphotos/)).

`flickr.photos.search` accepts a `license` filter alongside `user_id`, `tags` and `text`. `flickr.photos.licenses.getInfo` returns the authoritative licence IDs ([jentic Flickr summary](https://jentic.com/apis/flickr)). Accounts that defaulted to CC 2.0 have been upgraded to the equivalent 4.0 licences ([Flickr Help](https://www.flickrhelp.com/hc/en-us/articles/40048459562388-Copyright-Licenses-on-Flickr)), so query the ID table rather than hard-coding it. The commonly cited IDs (4 = CC BY 2.0, 5 = BY-SA 2.0, 9 = CC0, 10 = PDM) are unverified.

Openverse aggregates the same Flickr and Commons pool behind one API. It filters by `license_type=commercial` and returns `creator`, `license_url` and an `attribution` string ([jentic Openverse summary](https://jentic.com/apis/openverse)). It saves crawler work but adds no new images. Re-validate every hit against the original file page.

## Official channels hold the good images behind editorial and commercial gates

The images a fantasy app actually wants are official studio headshots and current vector logos. They sit with teams, tournament organisers and licensed data partners, and **none of them offers those images free for product use.**

### Team press kits

Teams publish brand kits, but for a different audience. NAVI's press kit describes "logos, brand assets and club information for media and partners" ([NAVI](https://navi.gg/en/company/presskit)). Team Liquid offers crest, wordmark, dark and light variants ([Team Liquid](https://teamliquid.com/brand-kit)). G2's guidelines forbid altering proportions or adding filters ([G2](https://g2esports.com/pages/brand-guidelines)). None of the snippets showed a licence for third-party products, and none included roster headshots. No press kit surfaced for Vitality, FaZe, Spirit, MOUZ, Astralis, Falcons, Eternal Fire, The MongolZ, HEROIC, Complexity or FURIA. These pages are best used as the files to attach to a permission request, not as a licence in themselves.

### Tournament organiser media portals

ESL FACEIT Group runs the clearest system. Its photo portal restricts use to "primary news and editorial outlets" with the credit line "Copyright: [photographer], ESL FACEIT Group" ([ESL Press Room](https://photos.eslgaming.com/Press)). Anything else goes through the paid **EFG Media Rights** platform ([EFG Media Rights](https://eslfaceitgroup.com/mediarights/)).

BLAST's press hub ties downloads to accreditation ([BLAST Press](https://blast.tv/press)). BLAST's Austin Major co-streaming rules even list "player photos" among the controlled broadcast features ([BLAST guidelines](https://blast.tv/cs/news/blasttv-austin-major-community-coverage-guidelines)). StarLadder gave its Budapest Major media kit only to accredited media ([StarLadder](https://starladder.com/en/news/starladder-opens-media-and-influencers-accreditation-for-the-budapest-major-2025)). Nothing was found for PGL or Perfect World.

### Riot and Valve

Riot's fan policy forbids using Riot logos or trademarks without a written licence and requires a non-endorsement notice ([Riot Legal](https://www.riotgames.com/en/legal)). It cannot license team logos or player likenesses anyway, because Riot does not own them. Valve lists Counter-Strike and its logo as trademarks ([Steam Legal](https://store.steampowered.com/legal/)). Its video policy is non-commercial only ([Valve Video Policy](https://store.steampowered.com/video_policy)). No Valve policy permits reusing Major sticker art.

### Data vendors

Data vendors expose images technically but not legally:

- **PandaScore** puts `image_url` on teams, players and leagues, and `dark_mode_image_url` on teams. Files sit at `cdn.pandascore.co/images/team/image/{id}/{slug}.png`, with `normal_` (800×800) and `thumb_` (200×200) filename prefixes ([PandaScore image docs](https://developers.pandascore.co/docs/image-optimization)). The free tier allows 1,000 requests per hour ([PandaScore pricing](https://www.pandascore.co/pricing)). However, its terms say customers may not "display, publish, or expose such data on any public-facing medium" unless their plan allows it, and no image licence clause was found ([PandaScore terms](https://www.pandascore.co/terms-and-condition)).
- **Liquipedia's** data is CC BY-SA 3.0. Its free LPDB tier is for non-commercial and community use at 60 requests per hour ([Liquipedia API terms](https://liquipedia.net/api-terms-of-use)), and paid access is currently "Enterprise plan" only ([Liquipedia API](https://liquipedia.net/api)). Its own copyright guide limits fair-use claims to logos and promotional graphics, "not photos" ([Liquipedia Copyright Guide](https://liquipedia.net/commons/A_Liquipedia_Guide_to_Copyright)). The ESL photo permission it holds explicitly excludes player profile photos ([Copyrights Repository](https://liquipedia.net/commons/Copyrights_Repository)).
- **HLTV's** terms prohibit scraping and require a licence for business use of site materials ([HLTV Terms](https://www.hltv.org/terms)).

### GRID

GRID is the one vendor whose public language points at image rights. GRID Open Access is historical data for "pre-revenue startups, students, and educational programs" ([GRID Open Access](https://grid.gg/open-access/)), with no sign of image rights. Commercial GRID, however, says its rights-holder relationships let its widgets show "esports teams' logotypes, players, and images" ([GRID widget launch](https://grid.gg/resources/newsroom/game-state-widget-launch/)). Its player privacy notice confirms it holds approved player profile images for "player cards" ([GRID player privacy notice](https://grid.gg/legal/esports-player-privacy-notice/)). Whether raw image files can be shown in a third-party fantasy UI depends on the contract. That is exactly the clause to negotiate.

### Logo APIs

Logo APIs fill the gap technically and push liability back onto the app:

- **logo.dev's** free plan requires a visible backlink for commercial use ([logo.dev attribution](https://www.logo.dev/docs/platform/attribution)).
- **Brandfetch** requires no attribution but demands hotlinking and forbids caching or storage ([Brandfetch docs](https://docs.brandfetch.com/logo-api/overview)). That conflicts with self-hosted images and share-card generation.
- **Clearbit's** free API ended in December 2025 ([HubSpot changelog](https://developers.hubspot.com/changelog/upcoming-sunset-of-clearbits-free-logo-api)).

Both live services state that logos remain their owners' trademarks. Their coverage of esports domains could not be tested.

## Free licences clear copyright, never trademark or likeness

This section is not legal advice; it summarises what the research found so the user can brief a lawyer. Every real image in a fantasy app carries up to four separate rights:

1. the photographer's or designer's **copyright**;
2. the player's **publicity or personality right**;
3. the team's **trademark** in its logo, including logos visible on jerseys in photos;
4. the publisher's or organiser's **marks**.

A free licence addresses only the first. The CC BY 4.0 legal code says plainly that "patent and trademark rights are not licensed", and it also excludes publicity and personality rights ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode)). Commons itself warns that commercial use of images of people "may require the explicit agreement of the subject" ([Commons reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)).

### Names and statistics: strong US protection

US law strongly protects the app's core. In **C.B.C. Distribution & Marketing v. MLB Advanced Media, 505 F.3d 818 (8th Cir. 2007)**, the court found every element of a Missouri publicity claim met. It still held that the First Amendment protects a fantasy operator's use of player names and statistics, because that information is in the public domain. The Supreme Court denied review in June 2008 ([IT Law Wiki](https://itlaw.fandom.com/wiki/C.B.C._Distribution_v._Major_League_Baseball); [Daily Record](https://thedailyrecord.com/2008/06/03/court-rejects-fantasy-baseball-dispute/)). CBS Interactive v. NFLPA (D. Minn. 2009) followed C.B.C. for fantasy football ([Courthouse News](https://api.courthousenews.com/judge-says-nfl-doesnt-ownstatistics-for-fantasy-league/)). Daniels v. FanDuel (Ind. 2018) applied Indiana's newsworthiness exception to "names, pictures, and statistics" even in paid-entry DFS ([Legal Sports Report](https://www.legalsportsreport.com/?p=25251)).

### Photos: unsettled in the US, riskier in Europe

**C.B.C. concerned names and statistics, not photographs.** Its public-domain reasoning fits faces poorly. Daniels reached pictures only under Indiana's statute. In practice, US sports operators license photos as standard: the NFLPA group licence expressly covers "names, likenesses and photographs" ([Loeb & Loeb summary](https://www.loeb.com/zh-hans/insights/publications/2009/05/cbs-interactive-inc-v-national-football-league-p__)). Esports has no equivalent body. The CSPPA, which once licensed player image rights to FLASHPOINT for $165,000, is listed as defunct ([HLTV](https://www.hltv.org/news/29931/flashpoint-csppa-in-dispute-over-165000-fee); [Liquipedia](https://liquipedia.net/counterstrike/CSPPA)).

Europe is stricter on images:

- **Germany.** KUG §22 requires consent to distribute a person's image ([DSHS Köln](https://www.dshs-koeln.de/fileadmin/redaktion/Institute/Sportrecht/Lehrmaterialien/11._Recht_am_eigenen_Bild_14_01_20.pdf)). Oliver Kahn won a German sales ban against EA despite a FIFPro collective licence ([Pinsent Masons](https://www.pinsentmasons.com/out-law/news/football-game-banned-over-players-image-rights)).
- **UK.** In Fenty v Arcadia, Topshop lost on passing off even though it had licensed the photo's copyright from the photographer ([judgment](https://caselaw.nationalarchives.gov.uk/ewca/civ/2015/3)).

### Logos: the name already does the job

Team logos fail a key test that team names pass. US nominative fair use asks whether only so much of the mark is used as is reasonably necessary, and whether anything suggests sponsorship ([Klemchuk on New Kids](https://klemchuk.com/ideate/nominative-fair-use)). In Toyota v. Tabari, the district court found the defendants' use of the Lexus logo was more than necessary ([Eric Goldman](https://blog.ericgoldman.org/archives/2010/07/funky_ninth_cir.htm)). The EU allows referential use only "in accordance with honest practices", which excludes implying a commercial link ([Fieldfisher](https://www.fieldfisher.com/en/services/intellectual-property/intellectual-property-blog/running-rings-around-referential-use-of-trade-marks-the-cjeus-decision-in-audi-v-gq)). Writing "Team Vitality" identifies the team; the crest adds mostly the look of affiliation.

### What free-to-play changes

Free-to-play lowers the stakes but does not change the analysis. Any ads, in-app purchases or sponsorships make the use commercial. No reported esports fantasy lawsuit or published cease-and-desist was found, but such letters are usually private.

| Asset | US risk, no licence | EU/UK risk, no licence |
|---|---|---|
| Player handles, names, stats | Low (C.B.C., CBS, Daniels) | Low-medium (GDPR lawful basis and LIA needed) |
| Team names in text | Low (nominative use) | Low (referential use, honest practices) |
| Team logos | Medium-high | Medium-high |
| Player photos, even CC-licensed | High | High (KUG §22, Kahn, Fenty) |

## Recommended plan: launch on data, license the pictures

The app's schema already anticipates this outcome. The comments on `teams.logo_url` and `players.portrait_url` in `src/server/db/schema.ts` read "Licensed logo from the data provider" and "Licensed portrait URL", with generated crests and illustrated portraits as the fallback. The plan below keeps that contract.

**Phase 1: launch with no unlicensed images.** Ship real player handles, names and stats, and team names and acronyms in text, which is the protected core. Leave `logo_url` and `portrait_url` null, and render the generated crests in each team's real `color` alongside the illustrated portraits. Add a visible "not affiliated with or endorsed by any team, league, Valve or Riot" notice. Avoid player names or faces in marketing such as "Play with s1mple!", which turns content into endorsement.

**Phase 2: put image rights into the GRID contract.** This is the main move. Ask GRID in writing for three things:

1. whether its feed includes team logo and player headshot URLs for CS2 (and LoL and VALORANT);
2. whether display in a third-party consumer fantasy UI is within the licence scope;
3. whether self-hosting or CDN caching is allowed.

If yes, populate `logo_url` and `portrait_url` from GRID through the existing `provider_records` and `external_ids` ingestion. That makes GRID the single licensed source, matching the schema's intent. Do not count on GRID Open Access for this, because it is historical and aimed at pre-revenue users.

**Phase 3: fill logo gaps with written team permission.** Email each org's press or partnerships contact, asking permission to show their logo, as supplied in their press kit, to identify the team in a free fantasy game. Self-host the file and keep the permission email on file. Start with the orgs that publish kits (NAVI, Liquid, G2, Fnatic, Cloud9, PURE). For headshots outside GRID, price **ESL FACEIT Group Media Rights**. Even then, a lawyer should confirm whether TO-licensed headshots also need player or team consent in the EU.

**Optional: Commons pipeline, behind a flag and legal review.** If a lawyer approves CC-licensed portraits for some markets, build the Wikidata-to-Commons pipeline. Add provenance fields the schema currently lacks: source, source URL, licence, licence URL, author credit, restrictions, permission reference and fetched date. A separate `media_assets` table keyed to team or player is the cleanest design. Accept only CC0, PD, CC BY and CC BY-SA. Publish CC BY-SA crops under CC BY-SA. Show credits per image. Exclude logos from this route entirely, given the doubtful licence claims.

**Avoid entirely:** scraping HLTV or Liquipedia images, Wikipedia non-free logos, PandaScore free-tier images in production, the unlicensed GitHub logo dump, and Valve sticker art. Use logo.dev or Brandfetch only for internal tooling, not as a substitute for permission.

## Conclusion

The search for a free image source ends at a structural fact. In esports, the valuable images are made by tournament organisers and teams, and they are deliberately monetised through editorial-only portals, accreditation gates and data-partner contracts. The free commons is a byproduct of a few fans with cameras at 2019 events. Free sources can therefore never be more than a patchy supplement, and even where they clear copyright, they leave the trademark and likeness layers exactly where they were.

The useful reframing is that images are a **contract term, not a data-engineering problem**. The app's highest-leverage action is not building a scraper or a Commons crawler. It is adding one clause to the GRID negotiation that is already planned, and sending a dozen permission emails to teams. Until those land, the generated crests and illustrated portraits are the legally conservative choice the schema was designed for, not a stopgap.
