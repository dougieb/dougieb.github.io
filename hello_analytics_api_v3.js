function makeApiCall() {
  queryAccounts();
}

function queryAccounts() {
  console.log('Querying Accounts.');

  // Get a list of all Google Analytics accounts for this user
  gapi.client.analytics.management.accounts.list().execute(handleAccounts);
}

function handleAccounts(results) {
  if (!results.code) {
    if (results && results.items && results.items.length) {

      // Get the first Google Analytics account
      var firstAccountId = results.items[0].id;

      // Query for Web Properties
      queryWebproperties(firstAccountId);

    } else {
      console.log('No accounts found for this user.')
    }
  } else {
    console.log('There was an error querying accounts: ' + results.message);
  }
}

function queryWebproperties(accountId) {
  console.log('Querying Webproperties.');

  // Get a list of all the Web Properties for the account
  gapi.client.analytics.management.webproperties.list({'accountId': accountId}).execute(handleWebproperties);
}

function handleWebproperties(results) {
  if (!results.code) {
    if (results && results.items && results.items.length) {

      // Get the first Google Analytics account
      var firstAccountId = 204993;

      // Get the first Web Property ID
      var firstWebpropertyId = "UA-204993-5";

      // Query for Views (Profiles)
      queryProfiles(firstAccountId, firstWebpropertyId);

    } else {
      console.log('No webproperties found for this user.');
    }
  } else {
    console.log('There was an error querying webproperties: ' + results.message);
  }
}

function queryProfiles(accountId, webpropertyId) {
  console.log('Querying Views (Profiles).');

  // Get a list of all Views (Profiles) for the first Web Property of the first Account
  gapi.client.analytics.management.profiles.list({
      'accountId': accountId,
      'webPropertyId': webpropertyId
  }).execute(handleProfiles);
}

function handleProfiles(results) {
  if (!results.code) {
    if (results && results.items && results.items.length) {

      // Get the first View (Profile) ID
      var firstProfileId = 269851;

      // Step 3. Query the Core Reporting API
      queryCoreReportingApi(firstProfileId);

    } else {
      console.log('No views (profiles) found for this user.');
    }
  } else {
    console.log('There was an error querying views (profiles): ' + results.message);
  }
}

function queryCoreReportingApi(profileId) {
  console.log('Querying Core Reporting API.');

  // Use the Analytics Service Object to query the Core Reporting API
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
	'dimensions': 'ga:browser,ga:browserVersion,ga:operatingSystem,ga:deviceCategory',
	//'filters': 'ga:deviceCategory==mobile',
    'start-date': '2013-12-01',
    'end-date': '2013-12-31',
    'metrics': 'ga:visitors',
	'sort': '-ga:visitors',
	'max-results': 10000
  }).execute(handleCoreReportingResults);
}

function handleCoreReportingResults(results) {
  if (results.error) {
    console.log('There was an error querying core reporting API: ' + results.message);
  } else {
    printResults(results);
  }
}

function printResults(results) {
	
	// scrub results
	formattedResultValues(results);
	
	// summarize
	var summary = summarize(results);
	
	var table = $('<table cellpadding="0" cellspacing="0" border="0"></table>');
	
	jQuery.each(summary, function(r, row) {
		var tr = $('<tr></tr>');
		tr.append('<td>'+row.category+'</td>');
		tr.append('<tr><td>Total</td><td>'+row.total+'</td></tr>');
	   	jQuery.each(row.os, function(osName, osVisits) {
			tr.append('<tr><td>'+osName+'</td><td>'+osVisits+'</td></tr>');
		});
		table.append(tr);
	});
	
	$('#results').append(table);

}

function formattedResultValues(results) {
	
	jQuery.each(results.rows, function(r, row) {
		jQuery.each(row, function(f, fvalue) {
			
			// get field name
			var fname = results.result.columnHeaders[f];
			
			if (fname.name == 'ga:browserVersion'){
				// get new value
				var newvalue = fvalue.substring(0, fvalue.indexOf('.'));
				results.rows[r][f] = newvalue;
			}
		});
	});
	
}

function headersArray(results) {
	
	var headers = {};
	jQuery.each(results.result.columnHeaders, function(h, header) {
		headers[header.name] = h;
	});
	
	return headers;
	
}

function summarize(results) {
	
	var headers = headersArray(results);

	var summary = {};

	for (var i = 0, c = results.rows.length; i < c; i += 1) {
	    var row = results.rows[i];
	    if (!summary.hasOwnProperty(row[headers['ga:deviceCategory']])) {
			summary[row[headers['ga:deviceCategory']]] = { category: '', osArray: [], os: {}, total: 0 };
			summary[row[headers['ga:deviceCategory']]].category = row[headers['ga:deviceCategory']];
		}
	    if (!summary[row[headers['ga:deviceCategory']]].os.hasOwnProperty(row[headers['ga:operatingSystem']])) {
			summary[row[headers['ga:deviceCategory']]].os[row[headers['ga:operatingSystem']]] = 0;
			summary[row[headers['ga:deviceCategory']]].osArray.push(row[headers['ga:operatingSystem']]);
		}
	    summary[row[headers['ga:deviceCategory']]].os[row[headers['ga:operatingSystem']]] += Number(row[headers['ga:visitors']]);
	    summary[row[headers['ga:deviceCategory']]].total += Number(row[headers['ga:visitors']]);
	}
	
	//sort
	
	return summary;
	
}

function compare(a,b) {
  return a.val - b.val
}
