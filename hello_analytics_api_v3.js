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

  var startDate = $('#start-date').val();
  var endDate = $('#end-date').val();

  // Use the Analytics Service Object to query the Core Reporting API
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
	'dimensions': 'ga:browser,ga:browserVersion,ga:operatingSystem,ga:operatingSystemVersion,ga:deviceCategory',
	//'filters': 'ga:deviceCategory==mobile',
    'start-date': startDate,
    'end-date': endDate,
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
	
	$('#results').empty();
	
	jQuery.each(summary, function(r, row) {
		
		var table = $('<table cellpadding="0" cellspacing="0" border="0"></table>');
		
		var tr = $('<tr></tr>');
		tr.append('<td>'+row.category+'</td>');
	   	tr.append('<tr><th>OS / Browser</th><th>Visits</th><th>% of '+row.category+'</th></tr>');
		jQuery.each(row.os, function(osName, osVisits) {
			if ((osVisits / row.total) > .01){
				tr.append('<tr><td>'+osName+'</td><td>'+osVisits+'</td><td>'+((osVisits / row.total)*100).toFixed(1)+'%</td></tr>');
			}
		});
		
		// add totals
		tr.append('<tr><th>'+row.category+' total</th><td><b>'+row.total+'</b></td></tr>');
		
		table.append(tr);
		
		$('#results').append(table);
		
	});
	

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
	
		var dimensionKey = row[headers['ga:operatingSystem']] + ' / ' + row[headers['ga:browser']];
	    if (!summary[row[headers['ga:deviceCategory']]].os.hasOwnProperty(dimensionKey)) {
			summary[row[headers['ga:deviceCategory']]].os[dimensionKey] = 0;
			summary[row[headers['ga:deviceCategory']]].osArray.push(dimensionKey);
		}
	    summary[row[headers['ga:deviceCategory']]].os[dimensionKey] += Number(row[headers['ga:visitors']]);
	    summary[row[headers['ga:deviceCategory']]].total += Number(row[headers['ga:visitors']]);
	}
	
	//sort
	
	for (category in summary) {
		var browserOSArray = [];
		for (bos in summary[category]['os']){
			var visits = summary[category]['os'][bos];
			browserOSArray.push({key: bos, visits: visits });
		}
		
		browserOSArray.sort(function(a, b){
			if (a.visits < b.visits) return 1;
			if (b.visits < a.visits) return -1;
			return 0;
		});
		
		console.log(summary);
		
		// replace options
		delete summary[category]['os'];
		summary[category]['os'] = {};
		
		for (item in browserOSArray){
			summary[category]['os'][browserOSArray[item].key] = browserOSArray[item].visits;
		}
		
	}
	
	return summary;
	
}

function compare(a,b) {
  return a.val - b.val
}
