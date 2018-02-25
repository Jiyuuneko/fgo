import json

fr = open('qp_cost.json', 'r')
result = json.loads(fr.read())
print(result)