const daysMap = {
    '1': 'mon',
    '2': 'tue',
    '3': 'wed',
    '4': 'thu',
    '5': 'fri',
    '6': 'sat',
    '7': 'sun',
}
const abbrevMap = Object.fromEntries(Object.entries(daysMap).map(kv => [kv[1], kv[0]]))

function dayOfWeekToAbbrv(day) {
    if (daysMap.has(day)) {
        return daysMap.get(day)
    } else {
        throw new Error(`Failed to map day ${day} to abbreviation.\nMap: ${Object.entries(daysMap)}`)
    }
}

function abbrevToDayOfWeek(abbrev) {
    if (abbrevMap.has(abbrev)) {
        return daysMap.get(abbrev)
    } else {
        throw new Error(`Failed to map day ${abbrev} to abbreviation.\nMap: ${Object.entries(abbrevMap)}`)
    }
}