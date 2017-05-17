require 'open-uri'
require 'nokogiri'
require 'json'

first_id = 2
last_id = 776
# last_id = .incident_list .incident a[href] /webapps/crime/:id/:slug

ids = (first_id..last_id)
incidents = []

ids.each do |id|

	url = "http://data.delawareonline.com/webapps/crime/#{id}/slug/"
	puts url

	begin

		doc = Nokogiri::HTML(open(url))

		incident = {}

		incident[:id] = id
		incident[:title] = doc.css('.article h1').first.text.strip

		location_date_time = doc.css('.time_place').to_s.split('<br>')
		incident[:location] = location_date_time[1].strip

		date_time = doc.css('.time_place').children.last.text.strip.split(', around ')
		incident[:date] = date_time.first
		incident[:time] = date_time.last

		incident[:summary] = doc.css('.inc_summary').first.text.strip
		incident[:any_juvenile_victims] = false
		incident[:any_juvenile_suspects] = false

		victims = []
		suspects = []

		victims_p = doc.css('table td').first.css('p')
		suspects_p = doc.css('table td').last.css('p')

		if victims_p.count >= 3
			victims_p.each_slice(3) do |p1, p2, p3|
				victim = {}
				name_age = p1.text.strip.split(',')
				victim[:unidentified] = p1.text.downcase.index("unidentified") != nil
				victim[:name] = name_age.first.strip
				victim[:age] = name_age.last.strip rescue nil
				victim[:status] = p2.text.strip
				victim[:killed] = p2.text.downcase.index("killed") != nil
				victim[:about] = p3.text.strip

				if !victim[:age].nil? && victim[:age].to_i < 18
					incident[:any_juvenile_victims] = true
				end

				victims << victim
			end
		end

		if suspects_p.count >= 3
			suspects_p.each_slice(3) do |p1, p2, p3|
				suspect = {}
				name_age = p1.text.strip.split(',')
				suspect[:unidentified] = p1.text.downcase.index("unidentified") != nil
				suspect[:name] = name_age.first.strip
				suspect[:age] = name_age.last.strip rescue nil
				suspect[:status] = p2.text.strip # charged date
				suspect[:arrest_date] = p2.text.strip.split('arrested on').last.strip.chomp('.')
				suspect[:about] = p3.text.strip # charged with

				if !suspect[:age].nil? && suspect[:age].to_i < 18
					incident[:any_juvenile_suspects] = true
				end

				suspects << suspect
			end
		end

		incident[:victims] = victims
		incident[:suspects] = suspects

		incident[:images] = doc.css('table td').css('img').map{|img| {src: img.attr('src'), name: img.attr('alt')} }

		lnglat = doc.css('script').text.match /"coordinates": \[(-?\d+.?\d+), (\d+.?\d+)\]/
		if !lnglat.nil?
			incident[:lng], incident[:lat] = lnglat[1], lnglat[2]
		else
			incident[:lng], incident[:lat] = nil, nil
		end

		puts incident
		puts ''

		incidents << incident

	rescue => error
		puts "ID #{id} had an error"
		p error
		p $!.backtrace
		puts ''
	end
end

File.open('incidents.json', 'w') do |f|
	f.puts JSON.pretty_generate(incidents)
end
puts "wrote file"