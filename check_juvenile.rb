require 'json'
require 'date'

incidents_file = File.read('incidents_with_census_blocks.json')
incidents_original = JSON.parse(incidents_file)

incidents = []

incidents_original.each do |incident_original|
	incident = incident_original
	incident[:any_juvenile_victims] = false
	incident[:any_juvenile_suspects] = false

	incident[:any_juvenile_killed] = false
	incident[:any_killed] = false

	incident[:all_juvenile_victims_and_suspects] = false

	if incident_original['victims'].count > 0
		ages = incident_original['victims'].map{ |p| p['age'].to_i }
		incident[:any_juvenile_victims] = ages.any?{|age| age < 18 }

		killed = incident_original['victims'].map{ |p| p['killed'] }
		incident[:any_killed] = killed.any?

		juvenile_killed = incident_original['victims'].map {|p| p['age'].to_i < 18 && p['killed'] }
		incident[:any_juvenile_killed] = juvenile_killed.any?
	end

	if incident_original['suspects'].count > 0
		ages = incident_original['suspects'].map{ |p| p['age'].to_i }
		incident[:any_juvenile_suspects] = ages.any?{|age| age < 18 }
	end

	if incident_original['victims'].count > 0 && incident_original['suspects'].count > 0
		all_juvenile_victims = incident_original['victims'].map{ |p| p['age'].to_i < 18 }.all?
		all_juvenile_suspects = incident_original['suspects'].map{ |p| p['age'].to_i < 18 }.all?
		incident[:all_juvenile_victims_and_suspects] = all_juvenile_victims && all_juvenile_suspects
	end

	incident['year'] = incident['date'].match(/, (\d{4})/)[1]

	incident_date = Date.parse(incident['date'])
	incident['year_month'] = "#{incident_date.year}-#{incident_date.month.to_s.rjust(2,'0')}"

	puts incident
	incidents << incident

end

File.open('incidents_juvenile_with_census_blocks.json', 'w') do |f|
	f.puts JSON.pretty_generate(incidents)
end
puts "wrote file"