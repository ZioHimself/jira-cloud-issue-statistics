class ReopenStatistic {
  _user;
  _reopenCount;
  _issues;
  constructor(user, issue) {
    this._user = user;
    this._issues = [];
    this._issues.push(issue);
    this._reopenCount = 1;
  }
  reopen = (issue) => {
    this._reopenCount++;
    this._issues.push(issue);
  }
}
class ReopenAct {
  _i;
  _u;
  _d;
  constructor (issueKey, userDisplayName, date) {
    this._i = issueKey;
    this._u = userDisplayName;
    this._d = date;
  }
}
var getPage = (jiraUrl, jql, offset, limit) => {
  return fetch(`${jiraUrl}/rest/api/2/search`, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow', // manual, *follow, error
    body: JSON.stringify({
      "jql": jql,
      "startAt": offset,
      "maxResults": limit,
      "expand": ["changelog"]
      , "fields":["key", "assignee", "changelog"]
    })
  })
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      // console.log(`POST /rest/api/2/search\nBody: ${JSON.stringify({
      //   "startAt": offset,
      //   "maxResults": limit,
      //   "expand": ["changelog"]
      //   //, "fields":["all"]
      // // })}\nResult:\nBody:${myJson}`);
      // })}\nResult:\ntotal=${myJson.total}\nmaxResults=${myJson.maxResults}`);
      return myJson;
    });
};

var reduceReopenActs = (i) => (_r, h) => {
  // console.log(`#reduceReopenActs i=${i.key} h ${h.author.displayName} on ${h.created}`);
  const hasReopen = h.items.some((it) => {
    if (it.field === "status") {
      // console.log(`${it.field}: ${it.fromString} -> ${it["toString"]}`);
    }
    return it.field === "status" && it.fromString === "In Testing" && it["toString"] === "Reopened";
  });
  if (hasReopen && i.fields && i.fields.assignee && i.fields.assignee.displayName) {
    // console.log(`#reduceReopenActs i=${i.key} reopen for user ${i.fields.assignee.displayName} on ${h.created}`);
    _r.push(new ReopenAct(i.key, i.fields.assignee.displayName, h.created))
  }
  return _r
};

var reduceIntoReopenStats = (r, act) => {
  const statsForUser = r[act._u];
  if (statsForUser) {
    // console.log(`#reduceIntoReopenStats user ${act._u} gets one more reopen for issue ${act._i} on ${act._d}!`);
    statsForUser.reopen(act._i);
  } else {
    // console.log(`#reduceIntoReopenStats user ${act._u} gets one reopen for issue ${act._i} on ${act._d}!`);
    r[act._u] = new ReopenStatistic(act._u, act._i)
  }
  return r
};

var reduceIssuesIntoReopenActs = (r, i) => {
  // get every changelog that has a field change item "In Testing" -> "Reopened"
  // console.log(`#reduceIssuesIntoReopenActs issue ${i.key} histories ${JSON.stringify(i.changelog.histories)}`);
  const reopenActsForThisIssue = i.changelog.histories.reduce(reduceReopenActs(i), []);
  r = r.concat(reopenActsForThisIssue);
  return r;
};

var getStatistics = async () => {
  let result = {};
  let totalReopenActs = [];
  let offset = 0;
  const limit = 50;
  while (true) {
    const pageFuture = getPage('JIRA_URL', "JQL_SEARCH_QUERY", offset, limit);
    const page = await pageFuture;
    const reopenActs = page.issues.reduce(reduceIssuesIntoReopenActs, []);
    console.log(`#getStatistics got page: ${offset + limit} / ${page.total}`);
    totalReopenActs = totalReopenActs.concat(reopenActs);
    result = reopenActs.reduce(reduceIntoReopenStats, result);
    //(accumulator, currentValue) => accumulator + currentValue
    const stop = offset + limit >= page.total;
    // const stop = offset >= limit * 3;
    if (stop) {
      console.log(`#getStatistics #result:`);
      console.log(`${JSON.stringify(result)}`);
      console.log(`#getStatistics #totalReopenActs:`);
      console.log(`${JSON.stringify(totalReopenActs)}`);
      return result;
    } else {
      offset += limit;
    }
  }
};
getStatistics();
