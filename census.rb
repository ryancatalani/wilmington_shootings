require 'json'
require 'httparty'

incidents_file = File.read('incidents.json')
incidents = JSON.parse(incidents_file)

resolved = []
errors = []

incidents.each do |incident|
	next if incident['id'].to_i < 407

	puts "getting #{incident['id']}"

	lat = incident['lat']
	lng = incident['lng']

	next if lat.nil? || lng.nil?

	census_url = "http://data.fcc.gov/api/block/find?latitude=#{lat}&longitude=#{lng}&showall=false&format=json"

	census_resp = HTTParty.get(census_url)
	census_data = JSON.parse(census_resp.body)

	if census_data['status'] == 'OK'
		puts "fips = #{census_data['Block']['FIPS']}"
		i = {}
		i[:id] = incident['id']
		i[:fips] = census_data['Block']['FIPS']
		resolved << i
	else
		puts "error"
		i = {}
		i[:id] = incident['id']
		i[:data] = census_data
		errors << i
	end

	puts ''
end

File.open('census_resolved.json', 'w') do |f|
	f.puts JSON.pretty_generate(resolved)
end
puts "wrote resolved"

if errors.count > 0
	File.open('census_errors.json', 'w') do |f|
		f.puts JSON.pretty_generate(errors)
	end
	puts "wrote errors"
end