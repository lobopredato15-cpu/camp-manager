# Import Format

Supported files:

- `.xlsx`
- `.csv`

Supported mappable columns:

- Employee ID
- First Name
- Last Name
- Full Name
- Company
- Camp
- Building
- Room
- Bed
- Arrival Date
- Arrival Time
- Departure Date
- Departure Time
- Inbound Flight
- Outbound Flight
- Airline
- Job Title
- Notes

The importer suggests mappings but does not require exact header names.

## Dates

Accepted:

- Excel serial dates.
- ISO dates.
- Australian `DD/MM/YYYY`.
- United States `MM/DD/YYYY` only when unambiguous.

Ambiguous dates are rejected for review instead of being guessed silently.

## Workflow

1. Select file.
2. Read headers.
3. Select Excel sheet when applicable.
4. Map columns.
5. Preview rows.
6. Validate all rows.
7. Show row-numbered errors and warnings.
8. Choose duplicate strategy.
9. Run dry run.
10. Confirm import.
11. Show result and allow undo when safe.

Original files must have configurable retention and must not be shared to other users' browsers.
