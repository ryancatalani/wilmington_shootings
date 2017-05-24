$(function(){

	var break1 = 540;

	var map_dots = createMap('map_dots');
	var last_incident_marker_clicked;

	var incidents_data;
	$.when(
		// $.getJSON('cb_2016_10_bg_500k.json', function(data) {
		// 	census_blocks_geojson = data;
		// }),
		$.getJSON('incidents_juvenile_with_census_blocks_c.json', function(data) {
			incidents_data = data;
		})
		// $.getJSON('tracts_years_diff.json', function(data) {
		// 	tracts_years_diff = data;
		// })
	).then(function() {
		if (incidents_data) {
			
			$('#loading').hide();
			$('.is_loading').css('opacity', 1).removeClass('is_loading');

			createDotMap({
				data: incidents_data,
				map: map_dots,
				toggle_el: '.toggle li',
				toggle_class: '.toggle',
				reset_btn: '#map_dots_reset'
			});

			addWilmingtonBoundsToMaps([map_dots]);
		}
	});

	Papa.parse('incident_counts_city_percapita.csv', {
		download: true,
		header: true,
		dynamicTyping: true,
		complete: function(results) {
			var rawData = results.data;
			var chartData = {
				labels: [],
				datasets: [
					{
						label: 'Teen gun violence incidents per 10,000 people',
						backgroundColor: 'rgb(0, 155, 255)',
						borderWidth: 0,
						data: []
					}
				]
			};

			var citiesToInclude = 10;
			var multiplier = 10000;
			var precision = 10;
			for (var i = 0; i < citiesToInclude; i++) {
				var cityData = rawData[i];
				var position = i+1;
				var name = '#' + position + ': ' + cityData.city + ', ' + stateNameToAbbr(cityData.state);
				var percapita = cityData.teen_incidents_tot_per_capita;
				var perpop = Math.round(percapita * multiplier * precision) / precision;

				chartData.labels.push(name);
				chartData.datasets[0].data.push(perpop);
			};

			var ctx = $('#chart_cities');
			var chartCities = new Chart(ctx, {
				type: 'horizontalBar',
				data: chartData,
				options: {
					legend: {
						position: 'bottom'
					}
				}
			});
		}
	});

	Papa.parse('juveniles_charged_gang.csv', {
		download: true,
		header: true,
		dynamicTyping: true,
		complete: function(results) {
			var rawData = results.data;
			var chartData = {
				labels: [],
				datasets: [
					{
						label: 'Juveniles charged with gang participation',
						backgroundColor: 'rgb(0, 155, 255)',
						borderColor: 'rgb(0, 119, 235)',
						borderWidth: 2,
						data: []
					}
				]
			};

			for (var i = 0; i < rawData.length; i++) {
				var yearData = rawData[i];
				chartData.labels.push(yearData.year);
				chartData.datasets[0].data.push(yearData.count);
			};

			var ctx = $('#chart_charged');
			var chartCharged = new Chart(ctx, {
				type: 'line',
				data: chartData,
				options: {
					legend: {
						position: 'bottom'
					}
				}
			});
		}
	});

	function createMap(elementID) {
		var map = L.map(elementID).setView([39.745833, -75.546667], 13);

		// var Hydda_Base = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
		// 	maxZoom: 18,
		// 	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		// }).addTo(map);
		// // https: also suppported.
	

		var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
			maxZoom: 16
		}).addTo(map);

		// var Hydda_RoadsAndLabels = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/roads_and_labels/{z}/{x}/{y}.png', {
		// 	maxZoom: 18,
		// 	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		// }).addTo(map);

		return map;
	}

	function createDotMap(opts) {
		var data = opts.data,
			map = opts.map;

		var markers = [];

		var month_year_hash = {},
			month_year_labels = [],
			month_year_values_all = [],
			month_year_values_juvenile = [];

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

			var month_year = incident.year_month;

			if (month_year_hash[month_year] === undefined) {
				month_year_hash[month_year] = {};
				month_year_hash[month_year].all = 1;
				if (incident.any_juvenile_victims || incident.any_juvenile_killed) {
					month_year_hash[month_year].juveniles = 1;
				} else {
					month_year_hash[month_year].juveniles = 0;
				}
			} else {
				month_year_hash[month_year].all += 1;
				if (incident.any_juvenile_victims || incident.any_juvenile_killed) {
					month_year_hash[month_year].juveniles += 1;
				}
			}

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

			}
		}

		for (var month_year in month_year_hash) {
			var values = month_year_hash[month_year];
			month_year_labels.push(month_year);
			month_year_values_all.push(values.all);
			month_year_values_juvenile.push(values.juveniles);
		}

		console.log(month_year_labels, month_year_values_all, month_year_values_juvenile);

		var chartData = {
			labels: month_year_labels,
			datasets: [
				{
					label: 'Gun violence incidents with juvenile victims',
					backgroundColor: 'rgb(158, 29, 10)',
					borderColor: 'rgb(131, 12, 0)',
					borderWidth: 2,
					data: month_year_values_juvenile
				},
				{
					label: 'All gun violence incidents',
					backgroundColor: 'rgb(0, 155, 255)',
					borderColor: 'rgb(0, 119, 235)',
					borderWidth: 2,
					data: month_year_values_all
				}
			]
		};

		var ctx = $('#chart_incidents_time');
		var chartIncidents = new Chart(ctx, {
			type: 'line',
			data: chartData,
			options: {
				legend: {
					position: 'bottom'
				}
			}
		});


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
		if (last_incident_marker_clicked !== undefined && last_incident_marker_clicked === opts.marker) {
			return;
		}

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
				$(panelID).slideDown(250);
			}
		}

		var incidentID = marker.options.incidentID;
		var incident = incidents_data.filter(function(incident_data){
			return incident_data.id === incidentID;
		})[0];

		// $('#desc_title').text(incident.title);
		$('#desc_date').text(incident.date + ' at ' + incident.time);
		$('#desc_loc').text(incident.location.replace(/&amp;/g, '&'));
		$('#desc_summary').text(incident.summary);

		if (incident.victims.length > 0) {
			var els = [];
			for (var i = 0; i < incident.victims.length; i++) {
				var victim = incident.victims[i];
				var text = victim.name;
				if (victim.age && victim.age.length > 0 && victim.age.toLowerCase().indexOf("unidentified") == -1 ) {
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

		// if (incident.suspects.length > 0) {
		// 	var els = [];
		// 	for (var i = 0; i < incident.suspects.length; i++) {
		// 		var suspect = incident.suspects[i];
		// 		var text = suspect.name;
		// 		if (suspect.age && suspect.age.length > 0) {
		// 			text += ', ' + suspect.age;
		// 		}
		// 		if (suspect.arrest_date && suspect.arrest_date.length > 0) {
		// 			text += ', arrested on ' + suspect.arrest_date;
		// 		}
		// 		if (suspect.about && suspect.about.length > 0) {
		// 			text += ': ' + suspect.about;
		// 		}
		// 		var el = $('<li></li>').text(text);
		// 		els.push(el);
		// 	};
		// 	$('#desc_suspects').html(els);
		// } else {
		// 	$('#desc_suspects').html('<li>No suspects identified</li>');
		// }

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
				$(panelID).slideUp(250);
			}
			marker.setRadius(4);
			last_incident_marker_clicked = undefined;
		});

	}

	function addWilmingtonBoundsToMaps(all_maps, opts={}) {
		$.getJSON('wilmington_bounds_topo.json', function(bounds_data) {

			for (var i = 0; i < all_maps.length; i++) {
				var map = all_maps[i];

				var style = opts.style || {
					color: '#333',
					opacity: 0.5,
					weight: 2,
					dashArray: "2, 5",
					fill: false
				}

				var boundsLayer = new L.TopoJSON(bounds_data, {
					style: style
				});
				boundsLayer.addTo(map);
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

	function stateNameToAbbr(stateName) {
		states_hash =  {
		    'Alabama': 'AL',
		    'Alaska': 'AK',
		    'American Samoa': 'AS',
		    'Arizona': 'AZ',
		    'Arkansas': 'AR',
		    'California': 'CA',
		    'Colorado': 'CO',
		    'Connecticut': 'CT',
		    'Delaware': 'DE',
		    'District Of Columbia': 'DC',
		    'Federated States Of Micronesia': 'FM',
		    'Florida': 'FL',
		    'Georgia': 'GA',
		    'Guam': 'GU',
		    'Hawaii': 'HI',
		    'Idaho': 'ID',
		    'Illinois': 'IL',
		    'Indiana': 'IN',
		    'Iowa': 'IA',
		    'Kansas': 'KS',
		    'Kentucky': 'KY',
		    'Louisiana': 'LA',
		    'Maine': 'ME',
		    'Marshall Islands': 'MH',
		    'Maryland': 'MD',
		    'Massachusetts': 'MA',
		    'Michigan': 'MI',
		    'Minnesota': 'MN',
		    'Mississippi': 'MS',
		    'Missouri': 'MO',
		    'Montana': 'MT',
		    'Nebraska': 'NE',
		    'Nevada': 'NV',
		    'New Hampshire': 'NH',
		    'New Jersey': 'NJ',
		    'New Mexico': 'NM',
		    'New York': 'NY',
		    'North Carolina': 'NC',
		    'North Dakota': 'ND',
		    'Northern Mariana Islands': 'MP',
		    'Ohio': 'OH',
		    'Oklahoma': 'OK',
		    'Oregon': 'OR',
		    'Palau': 'PW',
		    'Pennsylvania': 'PA',
		    'Puerto Rico': 'PR',
		    'Rhode Island': 'RI',
		    'South Carolina': 'SC',
		    'South Dakota': 'SD',
		    'Tennessee': 'TN',
		    'Texas': 'TX',
		    'Utah': 'UT',
		    'Vermont': 'VT',
		    'Virgin Islands': 'VI',
		    'Virginia': 'VA',
		    'Washington': 'WA',
		    'West Virginia': 'WV',
		    'Wisconsin': 'WI',
		    'Wyoming': 'WY'
		  }

		  var ret = states_hash[stateName];
		  if (ret !== undefined) {
		  	return ret;
		  } else {
		  	return '';
		  }

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