$(function(){

	var map_all = createMap('map_all');
	var map_juvenile_victims = createMap('map_juvenile_victims');
	var map_diff = createMap('map_diff');

	var all_maps = [map_all, map_juvenile_victims, map_diff];
	sync_maps(all_maps);

	var census_blocks_geojson, incidents_data, tracts_years_diff;
	$.when(
		$.getJSON('cb_2016_10_bg_500k.json', function(data) {
			census_blocks_geojson = data;
		}),
		$.getJSON('incidents_juvenile_with_census_blocks.json', function(data) {
			incidents_data = data;
		}),
		$.getJSON('tracts_years_diff.json', function(data) {
			tracts_years_diff = data;
		})
	).then(function() {
		if (census_blocks_geojson && incidents_data && tracts_years_diff) {
			
			$('#loading').hide();

			createChoroplethMap(
				census_blocks_geojson,
				incidents_data,
				map_all,
				['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']);

			var juvenile_victims_incidents = [];
			for (var i = 0; i < incidents_data.length; i++) {
				incident = incidents_data[i];
				if (incident.any_juvenile_victims) {
					juvenile_victims_incidents.push(incident);
				}
			};

			createChoroplethMap(
				census_blocks_geojson,
				juvenile_victims_incidents,
				map_juvenile_victims,
				['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']);

			createChoroplethTractsDiffMap({
				census_blocks_geojson: census_blocks_geojson,
				diff_data: tracts_years_diff,
				map: map_diff,
				scale_colors: ['#c51b7d','#e9a3c9','#fde0ef','#e6f5d0','#a1d76a','#4d9221'].reverse()
			});

			addZipCodeBoundsToMap(map_all);
			addZipCodeBoundsToMap(map_juvenile_victims);
			addZipCodeBoundsToMap(map_diff);
		}
	});

	function createMap(elementID) {
		var map = L.map(elementID).setView([39.745833, -75.546667], 13);

		var Hydda_Base = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);
		// https: also suppported.
		var Hydda_RoadsAndLabels = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/roads_and_labels/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);

		return map;
	}

	function createChoroplethMap(census_blocks_geojson, incidents_data, map, scale_colors) {
		var selected_geojson = {};
		selected_geojson.type = "FeatureCollection";
		selected_geojson.features = [];

		var block_groups = {};

		for (var i = 0; i < incidents_data.length; i++) {
	
			var fips = incidents_data[i].census_block_group_fips;
			if (typeof fips === "string") {
				if (block_groups[fips] === undefined) {
					block_groups[fips] = 1;
				} else {
					block_groups[fips] += 1;
				}
			}					

		};

		// console.log(block_groups);

		for (var i = 0; i < census_blocks_geojson.features.length; i++) {
			fips = census_blocks_geojson.features[i].properties.GEOID;

			if (block_groups[fips] !== undefined) {
				feature = census_blocks_geojson.features[i];
				feature.properties.incidents = block_groups[fips];
				selected_geojson.features.push(feature);
			}

			// census_blocks_geojson.features[i].incidents = block_groups[fips] || null;
		};

		// console.log(selected_geojson);

		createChoroplethLayers({
			map: map,
			selected_geojson: selected_geojson,
			scale_colors: scale_colors
		});
		
	}

	function createChoroplethTractsDiffMap(opts) {
		var census_blocks_geojson = opts.census_blocks_geojson;
		var diff_data = opts.diff_data;

		var selected_geojson = {};
		selected_geojson.type = "FeatureCollection";
		selected_geojson.features = [];

		// console.log(diff_data);

		for (var i = 0; i < census_blocks_geojson.features.length; i++) {
			tractce = census_blocks_geojson.features[i].properties.TRACTCE;

			if (diff_data[tractce] !== undefined) {
				feature = census_blocks_geojson.features[i];
				feature.properties.incidents = diff_data[tractce];
				selected_geojson.features.push(feature);
			}

		};

		// console.log(selected_geojson);

		createChoroplethLayers({
			map: opts.map,
			selected_geojson: selected_geojson,
			scale_colors: opts.scale_colors
		});
		
	}

	function createChoroplethLayers(opts) {
		var choroplethLayer = L.choropleth(opts.selected_geojson, {
		  valueProperty: 'incidents',
		  scale: opts.scale_colors,
		  steps: opts.scale_colors.length,
		  mode: 'q',
		  style: {
		    color: '#fff',
		    weight: 1,
		    fillOpacity: 0.7
		  },
		  onEachFeature: function (feature, layer) {
		    layer.bindPopup('Census block group ' + feature.properties.GEOID + '<br>' + feature.properties.incidents + ' incidents')
		  }
		}).addTo(opts.map);

		  var legend = L.control({ position: 'bottomright' });
		  legend.onAdd = function (map) {
		    var div = L.DomUtil.create('div', 'info legend');
		    var limits = choroplethLayer.options.limits;
		    var colors = choroplethLayer.options.colors;
		    var labels = [];

		    // Add min & max
		    div.innerHTML = '<div class="labels"><div class="min">' + limits[0] + '</div> \
					<div class="max">' + limits[limits.length - 1] + '</div></div>';

		    limits.forEach(function (limit, index) {
		      labels.push('<li style="background-color: ' + colors[index] + '"></li>')
		    });

		    div.innerHTML += '<ul>' + labels.join('') + '</ul>';
		    return div;
		  }
		  legend.addTo(opts.map);
	}

	function addZipCodeBoundsToMap(map) {
		$.getJSON('tl_2010_10_zcta510_topo.json', function(zipcodes_data) {

			var zipLayer = new L.TopoJSON(zipcodes_data, {
				style: {
					color: 'blue',
					opacity: 0.5,
					weight: 2,
					dashArray: "2, 5",
					fill: false
				}
			});
			zipLayer.addTo(map);

		});
	}

	function sync_maps(all_maps) {
		for (var i = 0; i < all_maps.length; i++) {
			var current_map = all_maps[i];
			for (var j = 0; j < all_maps.length; j++) {
				var sync_map = all_maps[j];
				if (current_map !== sync_map) {
					current_map.sync(sync_map);
				}
			};
		};
	}


	L.TopoJSON = L.GeoJSON.extend({
	    addData: function (data) {
	        var geojson, key;
	        if (data.type === "Topology") {
	            for (key in data.objects) {
	                if (data.objects.hasOwnProperty(key)) {
	                    geojson = topojson.feature(data, data.objects[key]);
	                    L.GeoJSON.prototype.addData.call(this, geojson);
	                }
	            }

	            return this;
	        }

	        L.GeoJSON.prototype.addData.call(this, data);

	        return this;
	    }
	});

	L.topoJson = function (data, options) {
	    return new L.TopoJSON(data, options);
	};


});