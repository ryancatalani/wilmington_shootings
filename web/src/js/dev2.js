$(function(){

	var break1 = 540;
	var map_dots;
	var last_incident_marker_clicked;
	var incidents_data;


	if ( $('#graphic_map').length > 0 ) {
		createGraphicMap();
	}

	if ( $('#graphic_cities').length > 0 ) {
		createGraphicCities();
	}

	if ( $('#graphic_juveniles').length > 0 ) {
		createGraphicJuveniles();
	}		


	function createGraphicMap() {
		map_dots = createMap('map_dots');
		
		// var json_url;
		// if (document.location.host.indexOf('localhost') === 0) {
			json_url = 'assets/data/incidents_ending0831.json';
		// } else {
			// json_url = 'https://rcpublic.s3.amazonaws.com/wilm_shootings/assets/data/incidents_new.json';
		// }

		$.when(
			$.getJSON(json_url, function(data) {
				incidents_data = data;
			})
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
	}

	function createGraphicCities() {
		Papa.parse('assets/data/midsize_teen_vics.csv', {
			download: true,
			header: true,
			dynamicTyping: true,
			complete: function(results) {
				var rawData = results.data;
				var chartData = {
					labels: [],
					datasets: [
						{
							label: 'People aged 12-17 injured or killed annually (per 1,000)',
							backgroundColor: [],
							borderWidth: 0,
							data: []
						}
					]
				};

				var citiesToInclude = 6;
				var multiplier = 1000;
				var precision = 10;
				var cityIndex = 1;
				for (var i = 0; i < citiesToInclude; i++) {
					var cityData = rawData[i];
					
					if (cityData.city != 'Chicago') {
						// var name = '#' + cityIndex + ': ' + cityData.city + ', ' + stateNameToAbbr(cityData.state);
						// cityIndex += 1;
						var name = cityData.city + ', ' + stateNameToAbbr(cityData.state);
						chartData.datasets[0].backgroundColor.push('#1b9cfa');
					} else {
						var name = cityData.city + ', ' + stateNameToAbbr(cityData.state);
						chartData.datasets[0].backgroundColor.push('#abdcfb');
					}
					var percapita = cityData.victimrate_over_teens;
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
						},
						scales: {
							xAxes: [{
								ticks: {
									min: 0
								},
								gridLines: {
									drawBorder: false,
									zeroLineColor: 'rgba(0,0,0,0.1)'
								}
							}],
							yAxes: [{
								gridLines: {
									display: false
								}
							}]
						}
					}
				});
			}
		});
	}

	function createGraphicJuveniles() {
		Papa.parse('assets/data/juveniles_charged_gang.csv', {
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
							backgroundColor: '#1b9cfa',
							borderWidth: 0,
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
						},
						scales: {
							xAxes: [{
								gridLines: {
									display: false
								}
							}],
							yAxes: [{
								gridLines: {
									drawBorder: false
								}
							}]
						}
					}
				});
			}
		});

	}




	function createMap(elementID) {
		var map = L.map(elementID).setView([39.745833, -75.546667], 13);

		var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
			maxZoom: 16
		}).addTo(map);

		return map;
	}

	function createDotMap(opts) {
		var data = opts.data,
			map = opts.map;

		var markers = [];
		var chartIncidents;

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
						// if every result is true, add incident ID to filtered IDs
						if (results.every(function(el) { return el })) {
							filteredIDs.push(incident.id);
						}

					});

					// console.log(filteredIDs);

					for (var i = 0; i < markers.length; i++) {
						var marker = markers[i];
						var inFilteredIDs = $.inArray(marker.options.incidentID, filteredIDs);
						if (inFilteredIDs > 0) {
							// should show
							if (!map.hasLayer(marker)) {
								marker.addTo(map);

								if (marker.options.juvenile) {
									marker.bringToFront();
								} else {
									marker.bringToBack();
								}

							}
						} else {
							// should hide
							if (map.hasLayer(marker)) {
								marker.removeFrom(map);
							}
						}
					};
					
					// chart manipulation
					var newChartData = filterOverTimeData(data, filterOptions);
					chartIncidents.config.data = newChartData;
					chartIncidents.update();

				}

			});
		}

		for (var i = 0; i < data.length; i++) {
			var incident = data[i];
			var lat = incident.lat;
			var lng = incident.lng;

			if (typeof lat == 'string' && typeof lng == 'string') {
				// (as long as they're not null)

				var juvenile = false;

				var markerOptions = {
					radius: 3,
					color: '#8500E1',
					weight: 1,
					fillOpacity: 0.5,
					incidentID: incident.id
				}

				if (incident.any_juvenile_killed) {
					markerOptions.color = '#B50E00';
					juvenile = true;
				} else if (incident.any_juvenile_victims) {
					markerOptions.color = '#1b9cfa';
					juvenile = true;
				} else {
					markerOptions.color = 'rgb(183, 183, 183)';
					markerOptions.fillOpacity = 0.25;
				}

				markerOptions.juvenile = juvenile;

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

				if (juvenile) {
					marker.bringToFront();
				} else {
					marker.bringToBack();
				}

				markers.push(marker);

			}
		}


		var chartData = filterOverTimeData(data);

		var ctx = $('#chart_incidents_time');
		chartIncidents = new Chart(ctx, {
			type: 'line',
			data: chartData,
			options: {
				legend: {
					position: 'bottom',
					labels: {
						filter: function(legendItem, chartData) {
							return (legendItem.text.indexOf('ongoing') == -1);
						}
					}
				},
				scales: {
					yAxes: [{
						ticks: {
							min: 0
						},
						gridLines: {
							drawBorder: false
						}
					}],
					xAxes: [{
						gridLines: {
							display: false
						},
					}]
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
						if (marker.options.juvenile) {
							marker.bringToFront();
						} else {
							marker.bringToBack();
						}
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
				var defaultChartData = filterOverTimeData(data);
				chartIncidents.config.data = defaultChartData;
				chartIncidents.update();
				
				return false;
			});
		}

		map.on('zoomend', function() {
			var markerRadius = 3;
			if (map.getZoom() > 13) {
				markerRadius = 4;
			} else if (map.getZoom() < 13) {
				markerRadius = 2;
			}

			for (var i = 0; i < markers.length; i++) {
				markers[i].setStyle({
					radius: markerRadius
				});
			};
		});

	}

	function filterOverTimeData(originalData, filters) {

		filters = typeof filters !== 'undefined' ? filters : {};

		var yearFilter = filters.year,
			onlyJuvenileFilter = filters.any_juvenile_victims;
		// yearFilter expects either "" (blank) or "2012" (year)
		// onlyJuvenileFilter is either blank or bool

		var viewAllYears = false;
		if (yearFilter === undefined || (typeof yearFilter === "string" && yearFilter.length === 0)) {
			viewAllYears = true;
		}
		var viewYearOngoing = false;
		if (yearFilter !== undefined && yearFilter == moment().year()) {
			viewYearOngoing = true;
		}

		var dateGroups,
			final_labels = [],
			final_values_all = [],
			final_values_juvenile = [];

		if (viewAllYears) {
			// blank -> all years
			dateGroups = _.groupBy(originalData, function(incident) {
				return incident.year;
			});
		} else {
			var onlyYear = _.filter(originalData, function(incident) {
				return incident.year == yearFilter;
			});
			dateGroups = _.groupBy(onlyYear, function(incident) {
				return incident.year_month;
			});
		}

		var overTimeData = _.mapObject(dateGroups, function(value, key) {

			// console.log(value);
			var thisYearAllVictims = _.flatten(_.map(value, function(incident){
				return incident.victims;
			}));

			var thisYearJuvenileVictims = _.filter(thisYearAllVictims, function(victim) {
				var age = +victim.age;
				return age < 17;
			});

			return {
				all: thisYearAllVictims.length,
				juveniles: thisYearJuvenileVictims.length
			}

			// This returns the count of incidents (not victims).
			// var count_all = value.length;
			// var count_juveniles = _.filter(value, function(incident) {
			// 	return incident.any_juvenile_victims;
			// }).length;
			// return {
			// 	all: count_all,
			// 	juveniles: count_juveniles
			// }
		});

		// Manually overriding total counts
		if (viewAllYears && (onlyJuvenileFilter === undefined || onlyJuvenileFilter === false)) {
			overTimeData = {
				2011: {
					all: 95,
					juveniles: 6
				},
				2012: {
					all: 118,
					juveniles: 9
				},
				2013: {
					all: 154,
					juveniles: 13
				},
				2014: {
					all: 124,
					juveniles: 12
				},
				2015: {
					all: 151,
					juveniles: 20
				},
				2016: {
					all: 145,
					juveniles: 30
				},
				2017: {
					all: 140,
					juveniles: 13
				}
			};
		}

		if (viewAllYears) {
			// blank -> all years
			final_labels = _.map(overTimeData, function(value, key) { return key });
		}
		else {
			final_labels = _.map(overTimeData, function(value, key) { 
				return moment(key).format('MMM YYYY');
			});
		}
		
		var chartData = {
			labels: final_labels,
			datasets: []
		};

		final_values_juvenile = _.map(overTimeData, function(value, key) { return value.juveniles });
		// MANUAL 2017 VALUE
		// if (viewAllYears || viewYearOngoing) {
		if (viewAllYears) {
			var length = final_values_juvenile.length;
			var last_value = final_values_juvenile.pop();
			var last_discontinuous_juvenile = Array(length-1);
			last_discontinuous_juvenile.push(last_value);

			var last_disconunuous_juvenile_dataset = {
				label: 'Juvenile victims of gun violence (ongoing)',
				backgroundColor: 'rgb(116, 23, 132)',
				borderColor: 'rgb(116, 23, 132)',
				borderWidth: 2,
				fill: false,
				data: last_discontinuous_juvenile,
				pointStyle: 'star',
				pointRadius: 5
			}
			chartData.datasets.push(last_disconunuous_juvenile_dataset);
		}
		var juvenile_dataset = {
			label: 'Juvenile victims of gun violence',
			backgroundColor: 'rgb(116, 23, 132)',
			borderColor: 'rgb(116, 23, 132)',
			borderWidth: 2,
			fill: false,
			data: final_values_juvenile
		}
		chartData.datasets.push(juvenile_dataset);

		if (onlyJuvenileFilter === undefined || onlyJuvenileFilter === false) {
			final_values_all = _.map(overTimeData, function(value, key) { return value.all });

			// MANUAL 2017 VALUE
			// if (viewAllYears || viewYearOngoing) {
			if (viewAllYears) {
				var length = final_values_all.length;
				var last_value = final_values_all.pop();
				var last_discontinuous_all = Array(length-1);
				last_discontinuous_all.push(last_value);

				var last_discontinuous_all_dataset = {
					label: 'All victims of gun violence (ongoing)',
					backgroundColor: '#999',
					borderColor: '#888',
					borderWidth: 2,
					fill: false,
					data: last_discontinuous_all,
					pointStyle: 'star',
					pointRadius: 5
				}
				chartData.datasets.push(last_discontinuous_all_dataset);
			}
			var all_dataset = {
				label: 'All victims of gun violence',
				backgroundColor: '#999',
				borderColor: '#888',
				borderWidth: 2,
				fill: false,
				data: final_values_all
			}
			chartData.datasets.push(all_dataset);
		}		


		return chartData;
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

	function addWilmingtonBoundsToMaps(all_maps, opts) {

		opts = typeof opts !== 'undefined' ? opts : {};

		$.getJSON('assets/data/wilmington_bounds_topo.json', function(bounds_data) {

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