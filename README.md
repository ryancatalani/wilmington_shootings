# Wilmington Shootings

Read the story: “[Wilmington: most dangerous place in America for youth](http://www.delawareonline.com/story/news/crime/2017/09/08/our-babies-killing-each-other/100135370/)” (Sept. 2017)

Data via the News Journal, USA Today, and the Associated Press.

Code and graphics © Ryan Catalani 2017. View the production versions at:
- [All three graphics](https://rcpublic.s3.amazonaws.com/wilm_shootings/index.html "All three graphics")
- [“Explore gun violence in Wilmington” (map)](https://rcpublic.s3.amazonaws.com/wilm_shootings/graphic_map.html)
- [“Teens injured or killed by gun violence annually”](https://rcpublic.s3.amazonaws.com/wilm_shootings/graphic_cities.html)
- [”Juveniles charged with gang participation”](https://rcpublic.s3.amazonaws.com/wilm_shootings/graphic_juveniles.html)

## Backend

Install necessary Ruby gems via `bundle`. 

Main files:
- `scrape_auto.rb`: Scrapes the News Journal’s shooting database to create an up-to-date JSON version, which is automatically uploaded to S3. Before using, include the environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET` in a `.env` file or elsewhere.
- `scrape.rb`: Same as above, but is not automatically updated or uploaded.

Auxiliary files (no longer used):
- `census.rb`: Fetches US Census block groups from geocoded incident data.
- `merge.rb`: Combines the fetched block groups with the incident data.
- `check_juvenile.rb`: Adds boolean fields to indicate whether juveniles were involved in the incidents. (This has now been included in `scrape.rb` and `scrape_auto.rb`.)
- `to_csv.rb`: Converts the JSON output of the above script to CSV.

## Frontend

All of these are in the `web` directory.

To compile, run `gulp`.

Primary development files:
- `dev2.html` is the main development HTML file.
- `src/js/dev2.js` is the main development Javascript file.
- `src/styles/dev.scss` is the main development SASS file. You can keep the CSS (`src/styles/dev.css`) updated by running `sass --watch dev.scss:dev.css`.
- `src/partials/graphic_map.html`, `src/partials/graphic_cities.html `, and `src/partials/graphic_juveniles` each create the standalone versions of those graphics, and should be kept in sync with `dev2.html`.

Other development files:
- `src/js/libs/` contains all the Javascript libraries.
- `src/styles/reset.scss` and `src/styles/leaflet.css` are automatically included or combined with the main (S)CSS file.
- `futura_today_demibold.woff` is used in some header styles.
- `src/partials/prod_header.html`, `src/partials/prod_footer.html`, and `src/partials/title.html` are combined by Gulp to create production versions of the standalone graphics files.
- `src/partials/dev_header.html` and `src/partials/dev_footer.html` are unused.

Gulp-generated production files:
- `index.html` has all three graphics.
- `graphic_map.html`, `graphic_cities.html`, and `graphic_juveniles.html` are standalone versions of those graphics.
- `assets/main.css` includes all necessary styles.
- `assets/main.min.js` and `assets/main.js` include all necessary Javascript. The minified version is included by default in the HTML files.

Data files (in `assets/data/`):
- `incidents_new.json` is used in the map graphic and is created via `scrape.rb`. (In production, `scrape_auto.rb` automatically updates this file and uploads it to S3.)
- `wilmington_bounds_topo.json` creates the city boundary in the map graphic.
- `midsize_teen_vics.csv` is used in the city comparison graphic.
- `juveniles_charged_gang.csv` is used in the juveniles charged graphic.