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
	'dimensions': 'ga:browser,ga:browserVersion,ga:operatingSystem,ga:operatingSystemVersion,ga:deviceCategory',
	'filters': 'ga:deviceCategory==mobile',
    'start-date': '2014-01-01',
    'end-date': '2014-01-31',
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
	
	formattedResultValues(results);
	
	var table = $('<table></table>');
	
	jQuery.each(results.rows, function(r, row) {
		var tr = $('<tr></tr>');
		tr.append('<td>'+r+'</td>');
	   	jQuery.each(row, function(f, field) {
			tr.append('<td>'+field+'</td>');
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
