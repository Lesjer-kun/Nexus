lines = open('D:/Coding/Current-working/Nexus/backend/routers/risk.py').read().split('\n')
for i, line in enumerate(lines):
    if 'return {"alerts"' in line and 'count' in line:
        lines[i] = '    return {"alerts": [a.model_dump() for a in alerts], "count": len(alerts)}'
        print(f'Fixed line {i+1}')
        break
open('D:/Coding/Current-working/Nexus/backend/routers/risk.py', 'w').write('\n'.join(lines))