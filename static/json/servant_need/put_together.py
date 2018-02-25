import json, os, sys

needs = {}
for file in os.listdir('./'):
  if file.endswith('json') and file != 'together_need.json' :
    f = open(file, 'r')
    need = json.loads(f.read())
    id_ = file.rstrip('.json')
    needs[id_] = need

f = open('../about_ids_names/ordered_material_ids.json', 'r')
ordered_ids = json.loads(f.read())

result = {
  "data": needs,
  "ordered_ids": ordered_ids
}

f = open('./together_need.json', 'w')
f.write(json.dumps(result, indent=2))