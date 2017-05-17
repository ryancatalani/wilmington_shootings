require 'json'

incidents_file = File.read('web/incidents_with_census_blocks.json')
incidents_original = JSON.parse(incidents_file)

incidents = []

incidents_original.each do |incident_original|
	incident = incident_original
	incident[:any_juvenile_victims] = false
	incident[:any_juvenile_suspects] = false

	if incident_original['victims'].count > 0
		ages = incident_original['victims'].map{ |p| p['age'].to_i }
		incident[:any_juvenile_victims] = ages.any?{|age| age < 18 }
	end

	if incident_original['suspects'].count > 0
		ages = incident_original['suspects'].map{ |p| p['age'].to_i }
		incident[:any_juvenile_suspects] = ages.any?{|age| age < 18 }
	end

	puts incident

	incidents << incident

end

File.open('incidents_juvenile_with_census_blocks.json', 'w') do |f|
	f.puts JSON.pretty_generate(incidents)
end
puts "wrote file"