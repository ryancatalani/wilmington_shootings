require 'json'

census_fips_file = File.read('census_resolved.json')
census_fips = JSON.parse(census_fips_file)

incidents_file = File.read('incidents.json')
incidents_original = JSON.parse(incidents_file)

incidents = []

incidents_original.each do |incident_original|
	incident = incident_original
	id = incident_original['id']
	census_block = census_fips.find{|c| c['id'] == id}

	if !census_block.nil?
		incident[:census_block_fips] = census_block['fips']
		incident[:census_block_group_fips] = census_block['fips'][0,12]
	else
		incident[:census_block_fips] = nil
		incident[:census_block_group_fips] = nil
	end

	incident['year'] = incident['date'].match(/, (\d{4})/)[1]

	incidents << incident
end


File.open('incidents_with_census_blocks.json', 'w') do |f|
	f.puts JSON.pretty_generate(incidents)
end
puts "wrote file"