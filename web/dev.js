$(function(){

	var break1 = 600;

	var map_dots = createMap('map_dots');
	// var map_all = createMap('map_all');
	// var map_juvenile_victims = createMap('map_juvenile_victims');
	// var map_diff = createMap('map_diff');
	// var map_heatmap = createMap('map_heatmap');

	// var all_maps = [map_all, map_juvenile_victims, map_diff, map_dots, map_heatmap];
	// sync_maps(all_maps);
	// sync_maps([map_heatmap, map_dots]);

	var last_incident_marker_clicked;

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

			// createChoroplethMap({
			// 	census_blocks_geojson: census_blocks_geojson,
			// 	incidents_data: incidents_data,
			// 	map: map_all,
			// 	scale_colors: ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']
			// });

			// var juvenile_victims_incidents = [];
			// for (var i = 0; i < incidents_data.length; i++) {
			// 	incident = incidents_data[i];
			// 	if (incident.any_juvenile_victims) {
			// 		juvenile_victims_incidents.push(incident);
			// 	}
			// };

			// createChoroplethMap({
			// 	census_blocks_geojson: census_blocks_geojson,
			// 	incidents_data: juvenile_victims_incidents,
			// 	map: map_juvenile_victims,
			// 	scale_colors: ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']
			// });

			// createChoroplethTractsDiffMap({
			// 	census_blocks_geojson: census_blocks_geojson,
			// 	diff_data: tracts_years_diff,
			// 	map: map_diff,
			// 	scale_colors: ['#c51b7d','#e9a3c9','#fde0ef','#e6f5d0','#a1d76a','#4d9221'].reverse()
			// });

			createDotMap({
				data: incidents_data,
				map: map_dots,
				toggle_el: '.toggle li',
				toggle_class: '.toggle',
				reset_btn: '#map_dots_reset'
			});

			// createHeatmap({
			// 	data: incidents_data,
			// 	map: map_heatmap
			// });

			// addZipCodeBoundsToMaps([map_dots]);
		}
	});

	function createMap(elementID) {
		var map = L.map(elementID).setView([39.745833, -75.546667], 13);

		// var Hydda_Base = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
		// 	maxZoom: 18,
		// 	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		// }).addTo(map);
		// // https: also suppported.
	

		var Esri_WorldGrayCanvas = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
			maxZoom: 16
		}).addTo(map);

		// var Hydda_RoadsAndLabels = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/roads_and_labels/{z}/{x}/{y}.png', {
		// 	maxZoom: 18,
		// 	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		// }).addTo(map);

		return map;
	}

	function createHeatmap(opts) {
		// https://github.com/Leaflet/Leaflet.heat

		var data = opts.data,
			map = opts.map;

		var latlngs = [];
		for (var i = 0; i < data.length; i++) {
			var incident = data[i];
			var lat = incident.lat;
			var lng = incident.lng;

			if (typeof lat == 'string' && typeof lng == 'string') {
				// (as long as they're not null)
				latlngs.push([lat, lng]);
			}
		};

		L.heatLayer(latlngs, {
			radius: 15,
			blur: 15
		}).addTo(map);
	}

	function createDotMap(opts) {
		var data = opts.data,
			map = opts.map;

		var markers = [];

		if (opts.toggle_el !== undefined && opts.toggle_class !== undefined) {
			var toggle_el = opts.toggle_el,
				toggle_class = opts.toggle_class;

			$(toggle_el).click(function(){
				if ( !$(this).hasClass('selected') ) {

					$(this).siblings('.selected').removeClass('selected');
					$(this).addClass('selected');

					var filterOptions = {};
					$(toggle_class).each(function() {
						var toToggle = $(this).data('toggle');
						var toggleOption = $(this).find('.selected').first().data('toggle-option');
						if (typeof toggleOption === 'string' && toggleOption.length === 0) {
							// blank, skip
						} else {
							filterOptions[toToggle] = toggleOption;
						}
					});
					console.log(filterOptions);

					var filteredIDs = [];

					incidents_data.filter(function(incident) {
						var results = [];
						for (var option in filterOptions) {
							var value = filterOptions[option];
							if (typeof value === 'string' && value.length === 0) {
								// skip
							} else {
								var result = incident[option] == value;
								results.push(result);
							}
						}
						if (results.every(function(el) { return el })) {
							filteredIDs.push(incident.id);
						}

					});

					console.log(filteredIDs);

					for (var i = 0; i < markers.length; i++) {
						var marker = markers[i];
						var inFilteredIDs = $.inArray(marker.options.incidentID, filteredIDs);
						if (inFilteredIDs > 0) {
							// should show
							if (!map.hasLayer(marker)) {
								marker.addTo(map);
							}
						} else {
							// should hide
							if (map.hasLayer(marker)) {
								marker.removeFrom(map);
							}
						}
					};
					

				}

			});
		}

		// var yearLayers = {};

		for (var i = 0; i < data.length; i++) {
			var incident = data[i];
			var lat = incident.lat;
			var lng = incident.lng;

			if (typeof lat == 'string' && typeof lng == 'string') {
				// (as long as they're not null)

				var markerOptions = {
					radius: 4,
					color: '#8500E1',
					weight: 1,
					fillOpacity: 0.5,
					incidentID: incident.id
				}

				if (incident.any_juvenile_killed) {
					markerOptions.color = '#f00';
				} else if (incident.any_juvenile_victims) {
					markerOptions.color = '#00f';
				} else {
					markerOptions.color = '#999';
				}

				var marker = L.circleMarker([lat, lng], markerOptions);
				marker.on('click', function(){
					highlightIncident({
						marker: this,
						map: map,
						panel: '#incident_desc_outer',
						closePanel: '.close_panel'
					});
				});

				marker.addTo(map);
				markers.push(marker);

				// if (yearLayers[incident.year] !== undefined) {
				// 	yearLayers[incident.year].addLayer(marker);
				// } else {
				// 	yearLayers[incident.year] = L.layerGroup(marker);
				// }

			}
		}

		if (opts.reset_btn !== undefined) {
			var $resetBtn = $(opts.reset_btn);
			$resetBtn.click(function(e){
				e.preventDefault();
				map.setView([39.745833, -75.546667], 13);
				$('#incident_desc_outer').hide();
				for (var i = 0; i < markers.length; i++) {
					var marker = markers[i];
					if (!map.hasLayer(marker)) {
						marker.addTo(map);
					} 
				};
				if (opts.toggle_el !== undefined && opts.toggle_class !== undefined) {
					$(opts.toggle_class).each(function(){
						$(this).find('.selected').removeClass('selected');
						$(this).children().first().addClass('selected');
					})
				}
				if (last_incident_marker_clicked !== undefined) {
					last_incident_marker_clicked.setRadius(4);	
				}
				return false;
			});
		}

	}

	function highlightIncident(opts) {
		var marker = opts.marker,
			map = opts.map,
			panelID = opts.panel,
			closePanelID = opts.closePanel;

		map.panTo(marker.getLatLng());

		if ( $(panelID).css('display') == 'none' ) {
			if ( $(window).width() >= break1 ) {
				$(panelID).css('right', '-250px').animate({
					right: 0
				}, 250).show();
			} else {
				$(panelID).show();
			}
		}

		var incidentID = marker.options.incidentID;
		var incident = incidents_data.filter(function(incident_data){
			return incident_data.id === incidentID;
		})[0];

		$('#desc_title').text(incident.title);
		$('#desc_date').text(incident.date + ' at ' + incident.time);
		$('#desc_loc').text(incident.location.replace(/&amp;/g, '&'));
		$('#desc_summary').text(incident.summary);

		if (incident.victims.length > 0) {
			var els = [];
			for (var i = 0; i < incident.victims.length; i++) {
				var victim = incident.victims[i];
				var text = victim.name;
				if (victim.age && victim.age.length > 0) {
					text += ', ' + victim.age;
				}
				if (victim.killed) {
					text += ', killed';
				}
				if (victim.about && victim.about.length > 0) {
					text += ': ' + victim.about;
				}
				var el = $('<li></li>').text(text);
				els.push(el);
			};
			$('#desc_victims').html(els);
		} else {
			$('#desc_victims').html('<li>No victims identified</li>');
		}

		if (incident.suspects.length > 0) {
			var els = [];
			for (var i = 0; i < incident.suspects.length; i++) {
				var suspect = incident.suspects[i];
				var text = suspect.name;
				if (suspect.age && suspect.age.length > 0) {
					text += ', ' + suspect.age;
				}
				if (suspect.arrest_date && suspect.arrest_date.length > 0) {
					text += ', arrested on ' + suspect.arrest_date;
				}
				if (suspect.about && suspect.about.length > 0) {
					text += ': ' + suspect.about;
				}
				var el = $('<li></li>').text(text);
				els.push(el);
			};
			$('#desc_suspects').html(els);
		} else {
			$('#desc_suspects').html('<li>No suspects identified</li>');
		}

		if (last_incident_marker_clicked !== undefined) {
			last_incident_marker_clicked.setRadius(4);
		}

		marker.setRadius(20);
		last_incident_marker_clicked = marker;

		$(closePanelID).click(function(){
			if ( $(window).width() >= break1 ) {
				$(panelID).animate({
					right: -250
				}, 250, function(){
					$(this).hide();
				});
			} else {
				$(panelID).hide();
			}
			marker.setRadius(4);
			last_incident_marker_clicked = undefined;
		});

	}

	// function createChoroplethMap(census_blocks_geojson, incidents_data, map, scale_colors) {
	function createChoroplethMap(opts) {
		var census_blocks_geojson = opts.census_blocks_geojson;
		var incidents_data = opts.incidents_data;

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
			map: opts.map,
			selected_geojson: selected_geojson,
			scale_colors: opts.scale_colors
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

	function addZipCodeBoundsToMap(map, opts={}) {
		$.getJSON('tl_2010_10_zcta510_topo.json', function(zipcodes_data) {

			var style = opts.style || {
				color: 'blue',
				opacity: 0.5,
				weight: 2,
				dashArray: "2, 5",
				fill: false
			}

			var zipLayer = new L.TopoJSON(zipcodes_data, {
				style: style
			});
			zipLayer.addTo(map);

		});
	}

	function addZipCodeBoundsToMaps(all_maps, opts={}) {
		$.getJSON('tl_2010_10_zcta510_topo.json', function(zipcodes_data) {

			for (var i = 0; i < all_maps.length; i++) {
				var map = all_maps[i];

				var style = opts.style || {
					color: 'blue',
					opacity: 0.5,
					weight: 2,
					dashArray: "2, 5",
					fill: false
				}

				var zipLayer = new L.TopoJSON(zipcodes_data, {
					style: style
				});
				zipLayer.addTo(map);
			};

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


	// https://blog.webkid.io/maps-with-leaflet-and-topojson/
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

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
	if (!Array.prototype.filter) {
	  Array.prototype.filter = function(fun/*, thisArg*/) {
	    'use strict';

	    if (this === void 0 || this === null) {
	      throw new TypeError();
	    }

	    var t = Object(this);
	    var len = t.length >>> 0;
	    if (typeof fun !== 'function') {
	      throw new TypeError();
	    }

	    var res = [];
	    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
	    for (var i = 0; i < len; i++) {
	      if (i in t) {
	        var val = t[i];

	        // NOTE: Technically this should Object.defineProperty at
	        //       the next index, as push can be affected by
	        //       properties on Object.prototype and Array.prototype.
	        //       But that method's new, and collisions should be
	        //       rare, so use the more-compatible alternative.
	        if (fun.call(thisArg, val, i, t)) {
	          res.push(val);
	        }
	      }
	    }

	    return res;
	  };
	}

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
	if (!Array.prototype.every) {
	  Array.prototype.every = function(callbackfn, thisArg) {
	    'use strict';
	    var T, k;

	    if (this == null) {
	      throw new TypeError('this is null or not defined');
	    }

	    // 1. Let O be the result of calling ToObject passing the this 
	    //    value as the argument.
	    var O = Object(this);

	    // 2. Let lenValue be the result of calling the Get internal method
	    //    of O with the argument "length".
	    // 3. Let len be ToUint32(lenValue).
	    var len = O.length >>> 0;

	    // 4. If IsCallable(callbackfn) is false, throw a TypeError exception.
	    if (typeof callbackfn !== 'function') {
	      throw new TypeError();
	    }

	    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
	    if (arguments.length > 1) {
	      T = thisArg;
	    }

	    // 6. Let k be 0.
	    k = 0;

	    // 7. Repeat, while k < len
	    while (k < len) {

	      var kValue;

	      // a. Let Pk be ToString(k).
	      //   This is implicit for LHS operands of the in operator
	      // b. Let kPresent be the result of calling the HasProperty internal 
	      //    method of O with argument Pk.
	      //   This step can be combined with c
	      // c. If kPresent is true, then
	      if (k in O) {

	        // i. Let kValue be the result of calling the Get internal method
	        //    of O with argument Pk.
	        kValue = O[k];

	        // ii. Let testResult be the result of calling the Call internal method
	        //     of callbackfn with T as the this value and argument list 
	        //     containing kValue, k, and O.
	        var testResult = callbackfn.call(T, kValue, k, O);

	        // iii. If ToBoolean(testResult) is false, return false.
	        if (!testResult) {
	          return false;
	        }
	      }
	      k++;
	    }
	    return true;
	  };
	}



});