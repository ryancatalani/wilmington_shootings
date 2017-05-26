require 'json'
require 'csv'
require 'time'

incidents_file = File.read('web/incidents_juvenile_with_census_blocks.json')
incidents = JSON.parse(incidents_file)

headers = (incidents.first.keys & incidents.last.keys).sort

incidents_for_csv = incidents.map do |incident|
	incident['any_suspects'] = incident['suspects'].count > 0
	incident['hour'] = Time.parse(incident['time']).hour rescue ''
	incident['day_of_week'] = Time.parse(incident['date']).strftime('%w')

	all_headers = headers + %w(any_suspects hour day_of_week)

	incident.delete_if {|k,v| v.class == Hash || v.class == Array || !all_headers.include?(k) }
	incident.sort.to_h
end

headers = (incidents_for_csv.first.keys & incidents_for_csv.last.keys).sort

CSV.open('incidents.csv', 'wb') do |csv|
	csv << headers
	incidents_for_csv.each do |hash|
		csv << hash.values
	end
end
puts "wrote csv file"