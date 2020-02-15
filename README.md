# jira-cloud-issue-statistics
Gather arbitrary issue statistics from public Jira API via JS

# How to use
1. Open stats.js, replace JIRA_URL and JQL_SEARCH_QUERY with your Jira Cloud URL (it should end with `.atlassian.net` / `.jira.com`)
2. Log into your Jira Cloud
3. Open up browser console (https://bit.ly/2OYlZHT)
4. Paste the contents of your stats.js
5. Use either the JSON produced after logging `#getStatistics #result:` or JSON produced after logging `#getStatistics #totalReopenActs:` (latter is better suited for JSON to CSV conversion / import)

# Support
Feel free to open issues if any questions arise. No guarantees on SLA.
