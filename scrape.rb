require 'open-uri'
require 'nokogiri'
require 'json'
require 'time'

first_id = 2
last_id = 823

ids = (first_id..last_id)
incidents = []
errors = []

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

		time_obj = Time.parse("#{date_time.first} #{date_time.last}")
		incident[:year] = time_obj.year
		incident[:year_month] = "#{time_obj.year}-#{time_obj.month.to_s.rjust(2,'0')}"
		incident[:iso8601] = time_obj.iso8601

		incident[:summary] = doc.css('.inc_summary').first.text.strip
		incident[:any_juvenile_victims] = false
		incident[:any_juvenile_suspects] = false
		incident[:any_juvenile_killed] = false
		incident[:any_killed] = false
		incident[:all_juvenile_victims_and_suspects] = false

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
				if name_age.count > 1
					victim[:age] = name_age.last.strip rescue nil
				else
					victim[:age] = nil
				end
				victim[:status] = p2.text.strip
				victim[:killed] = p2.text.downcase.index("killed") != nil
				victim[:about] = p3.text.strip

				if victim[:killed]
					incident[:any_killed] = true
				end

				if !victim[:age].nil? && victim[:age].to_i < 18
					incident[:any_juvenile_victims] = true
					if victim[:killed]
						incident[:any_juvenile_killed] = true
					end
				end

				victims << victim
			end
		end

		if suspects_p.count >= 3
			if suspects_p.count % 3 == 0
				suspects_p.each_slice(3) do |p1, p2, p3|
					suspect = {}
					name_age = p1.text.strip.split(',')
					suspect[:unidentified] = p1.text.downcase.index("unidentified") != nil
					suspect[:name] = name_age.first.strip
					if name_age.count > 1
						suspect[:age] = name_age.last.strip rescue nil
					else
						suspect[:age] = nil
					end
					suspect[:status] = p2.text.strip # charged date
					suspect[:arrest_date] = p2.text.strip.split('arrested on').last.strip.chomp('.')
					suspect[:about] = p3.text.strip # charged with

					if !suspect[:age].nil? && suspect[:age].to_i < 18
						incident[:any_juvenile_suspects] = true
					end

					suspects << suspect
				end
			else
				suspects_p.css('strong').each do |p1|
					suspect = {}
					name_age = p1.text.strip.split(',')
					suspect[:unidentified] = p1.text.downcase.index("unidentified") != nil
					suspect[:name] = name_age.first.strip
					if name_age.count > 1
						suspect[:age] = name_age.last.strip rescue nil
					else
						suspect[:age] = nil
					end
					suspect[:status] = nil
					suspect[:arrest_date] = nil
					suspect[:about] = nil
					if !suspect[:age].nil? && suspect[:age].to_i < 18
						incident[:any_juvenile_suspects] = true
					end

					suspects << suspect
				end
			end
		end

		if victims.any? && suspects.any?
			all_juvenile_victims = victims.map{ |p| p[:age].nil? ? false : p[:age].to_i < 18 }.all?
			all_juvenile_suspects = suspects.map{ |p| p[:age].nil? ? false : p[:age].to_i < 18 }.all?
			incident[:all_juvenile_victims_and_suspects] = all_juvenile_victims && all_juvenile_suspects
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
		errors << id
		puts "ID #{id} had an error"
		p error
		p $!.backtrace
		puts ''
	end
end

timestamp = Time.now.strftime("%Y%m%d-%H%M")
File.open("incidents_scraped_#{timestamp}.json", 'w') do |f|
	f.puts JSON.pretty_generate(incidents)
end
puts "errors on IDs #{errors.join(', ')}" if errors.any?
puts "wrote file (incidents count: #{incidents.count})"