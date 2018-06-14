const Binance = require('node-binance-api');
const Twitter = require('twitter');
const fs = require('fs');

const client = new Twitter({
	consumer_key: <consumer_key>,
	consumer_secret: <consumer_secret>,
	access_token_key: <access_token_key>,
	access_token_secret: <access_token_secret>
});

const TICKERS_FILE = 'tickers.json';

// If this is the first time running this script, create a tickers.json file.
if( !fs.existsSync(TICKERS_FILE) ){
	fs.openSync(TICKERS_FILE, 'w');
	fs.writeFileSync(TICKERS_FILE, '[]');
}

const binance = new Binance();
binance.prices((error, tickers) => {
	let live_tickers = Object.keys(tickers)
		.filter(ticker => ticker.endsWith('BTC')) // filter for the BTC pairs (e.g. ETHBTC, LTCBTC)
		.map(ticker => ticker.substring(0,ticker.length-3)); // extract the ticker (ETHBTC becomes ETH)

	// Read the existing tickers out of our json file
	let existing_tickers = JSON.parse( fs.readFileSync(TICKERS_FILE) );

	let new_tickers = live_tickers.filter(ticker => {
		return existing_tickers.indexOf(ticker) < 0;
	});

	// Write the current list of tickers to our JSON file
	fs.writeFileSync( TICKERS_FILE, JSON.stringify(live_tickers) );

	if( new_tickers.length > 0 ){
		// string the new tickers together and add a '$' before each one
		let twitterized_tickers = new_tickers.reduce((a,c)=> `${a} $${c}`, ''); 

		let tweet = `${new_tickers.length} new coin(s) have just been added to #BINANCE! ${twitterized_tickers}`;
		client.post('statuses/update', {status: tweet}, function(error, tweet, response) {
			if (!error) {
				console.log('success');
			} else{
				console.log('there was an error with the tweet: ' + error[0].message);
			}
		});
		console.log(tweet);
	} else {
		console.log(' no new tickers')
	}
});