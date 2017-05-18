require 'time'
require 'json'

file = File.read('web/incidents_juvenile_with_census_blocks.json')
data = JSON.parse(file)
# block_groups_hash = data.group_by{|d| d['census_block_group_fips']}

# block_groups_years = {}

# block_groups_hash.each do |block_group, incidents|
# 	puts block_group
# 	years = incidents.group_by{|i| Time.parse(i['date']).year }
# 	puts years.keys

# end

tracts_hash = data.group_by{|d| d['census_block_group_fips'][0,11] rescue nil }

tracts_years = {}

tracts_hash.each do |tract, incidents|
	years = incidents.group_by{|i| Time.parse(i['date']).year }
	tracts_years[tract] = Hash[years.collect{|y, i| [y, i.count]}]
	# puts into the form 2011: 2, 2012: 5, etc
end

tracts_years_diff = {}

tracts_years.each do |tract, years_hash|
	next if tract.nil?
		
	y_2011_12 = years_hash.select{|k,v| k == 2011 || k == 2012}.map{|k,v| v}.inject(:+) || 0
	y_2016_17 = years_hash.select{|k,v| k == 2016 || k == 2017}.map{|k,v| v}.inject(:+) || 0

	tractce = tract[5,11] # to match geojson

	if y_2011_12 != 0 || y_2016_17 != 0
		diff = y_2016_17 - y_2011_12
		tracts_years_diff[tractce] = diff
	end

end

puts tracts_years_diff