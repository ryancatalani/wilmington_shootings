require 'time'
require 'json'

file = ""
data = JSON.parse(file)
block_groups = data.group_by{|d| d['census_block_group_fips']}