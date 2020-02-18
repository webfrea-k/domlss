const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);


exports.checkOutlived = functions.https.onRequest((req, resp) => {
	console.log('START CheckOutlived');
	var promises = new Array();
	var celebrities = new Array();
	var queryCelebs = admin.database().ref("celebrity").orderByKey();
		queryCelebs.once("value")
		.then(function(snapshot) {
				snapshot.forEach(function(childSnapshot) {
					var childData = childSnapshot.val();
					var celebrity = {name: childData.name, daysalive: parseInt(childData.daysalive)};
					celebrities.push(celebrity);
				});
				var query = admin.database().ref("users").orderByChild("active").equalTo(true);
				query.once("value")
				.then(function(snapshot) {
						snapshot.forEach(function(childSnapshot) {
							var key = childSnapshot.key;
							var childData = childSnapshot.val();
							childSnapshot.child('birthdays').forEach(function (d) {
								if(d.val() != 0 && d.key != '+ Add person') {
									var date1 = new Date(d.val());
									var date2 = new Date();
									var timeDiff = Math.abs(date2.getTime() - date1.getTime());
									var diffDays = parseInt(Math.ceil(timeDiff / (1000 * 3600 * 24)));

									var outlivedToday = celebrities.filter(function (el) {
										return (el.daysalive == diffDays);
									});

									outlivedToday.forEach(function (celeb) {
										const payload = {notification: {
											title: d.key + ' just outlived ' + celeb.name,
											body: 'Congratulations ;)'
											}
										};
										admin.messaging().sendToDevice([childData.token], payload);
										console.log('User: ' + d.key + ' outlived: ' + celeb.name);

									});
								}
							});
						});
				});
				resp.send("success");
		});
});

exports.getQuote = functions.https.onRequest((req, resp) => {
	console.log('START getQuote');
	var promises = new Array();
	var celebrities = new Array();
	var queryCelebs = admin.database().ref("celebrity").orderByKey();
		queryCelebs.once("value")
		.then(function(snapshot) {
				snapshot.forEach(function(childSnapshot) {
					var childData = childSnapshot.val();
					var celebrity = {name: childData.name, daysalive: parseInt(childData.daysalive)};
					celebrities.push(celebrity);
				});

				var outlivedToday = celebrities.filter(function (el) {
					return (el.daysalive == req.query.daysAlive);
				});
				if (outlivedToday === undefined || outlivedToday.length == 0) {
					var count = 0;
					var queryCelebs = admin.database().ref("quote").orderByChild("active").equalTo(true);
					queryCelebs.once("value")
					.then(function(snapshot) {
							var rand = Math.floor(Math.random() * snapshot.numChildren());
							console.log('RAND2: ' + rand);
							snapshot.forEach(function(childSnapshot) {
								var childData = childSnapshot.val();
								if (count == rand) {
									resp.send(childData.name);
								}
								count ++;
							});
					});
				} else {
					resp.send('You have outlived ' + outlivedToday[0].name + ' today!');
				}
		});
});
