require 'json'
require 'csv'
require 'time'
require 'httparty'

incidents_file = File.read('web/incidents_juvenile_with_census_blocks.json')
incidents = JSON.parse(incidents_file)

# first pass at headers
headers = (incidents.first.keys & incidents.last.keys).sort

incidents_for_csv = incidents.map do |incident|
	# add additional fields
	incident['any_suspects'] = incident['suspects'].count > 0
	incident['hour'] = Time.parse(incident['time']).hour rescue ''
	incident['day_of_week'] = Time.parse(incident['date']).strftime('%w')

	if incident['census_block_group_fips'].nil?
		incident['census_block_group_fips'] = ''
		incident['census_block_fips'] = ''
		begin
			lat = incident['lat']
			lng = incident['lng']

			if !lat.nil? && !lng.nil?
				census_url = "http://data.fcc.gov/api/block/find?latitude=#{lat}&longitude=#{lng}&showall=false&format=json"
				census_resp = HTTParty.get(census_url)
				census_data = JSON.parse(census_resp.body)

				if census_data['status'] == 'OK'
					puts "#{incident['id']} fips = #{census_data['Block']['FIPS']}"
					incident['census_block_fips'] = census_data['Block']['FIPS']
					incident['census_block_group_fips'] = census_data['Block']['FIPS'][0,12]
				else
					puts "error on #{incident['id']}"
				end
			end
		rescue
			puts "error on #{incident['id']}"
		end
	end

	# define all acceptable headers
	all_headers = headers + %w(any_suspects hour day_of_week census_block_fips census_block_group_fips)

	# remove multidimensional/unused fields and sort
	incident.delete_if {|k,v| v.class == Hash || v.class == Array || !all_headers.include?(k) }
	incident.sort.to_h
end

# ensure headers are updated
headers = (incidents_for_csv.first.keys & incidents_for_csv.last.keys).sort

CSV.open('incidents_with_census.csv', 'wb') do |csv|
	csv << headers
	incidents_for_csv.each_with_index do |hash, index|
		begin
			csv << hash.values
		rescue
			puts "error on index #{index}"
		end
	end
end
puts "wrote csv file"