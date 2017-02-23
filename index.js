var express = require("express");
var http = require("http");
var app = express();
var server = http.Server(app);
var socketIO = require("socket.io");
var io = socketIO(server);

var oneDay = 60 * 60 * 24 * 1000;
var thirtyDays = oneDay * 30;

var currentStocks = ["csco", "f", "ge", "pg", "luv", "ibm"];


app.get("/", function(request, response)
{
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Content-Type", "text/html");
	response.sendFile(__dirname + "/index.html");
});

app.get("/main.js", function(request, response)
{
	response.sendFile(__dirname + "/main.js");
});

app.get("/getYahooData", doGetYahooData);

app.get("/getCurrentStocks", doGetCurrentStocks);

app.get("/removeStock", doRemoveCurrentStock);

app.get("/doesStockExist", doDoesStockExist);

app.get("/addNewStock", doAddNewStock);

io.on("connection", function(socket)
{
	console.log("Websocket connection has been made.");
});

server.listen(8080);
console.log("Listening to port 8080");

// Proxy for Yahoo! Finance query
function doGetYahooData(request, response)
{
	var options =
	{
		method: "GET",
		host: "ichart.finance.yahoo.com",
		path: "/table.csv?s=" + request.query.symbol +
			"&a=" + request.query.fromMonth +
			"&b=" + request.query.fromDay +
			"&c=" + request.query.fromYear +
			"&d=" + request.query.toMonth +
			"&e=" + request.query.toDay +
			"&f=" + request.query.toYear +
			"&g=d&ignore=.csv"
	};
	
	var callback = function(r)
	{
		var s = "";
		r.on("data", function(chunk) { s += chunk; });
		r.on("end", function()
		{
			response.setHeader("Content-Type", "application/csv");
			response.end(s);
		});
	}

	http.request(options, callback).end();
}

function doDoesStockExist(request, response)
{
	response.setHeader("Content-Type", "text/json");

	var options =
	{
		method: "GET",
		host: "ichart.finance.yahoo.com",
		path: "/table.csv?s=" + request.query.symbol
	};

	var callback = function(r)
	{
		response.end(JSON.stringify({ success: (r.statusCode == 200) }));
	}

	http.request(options, callback).end();
}

function doGetCurrentStocks(request, response)
{
	response.setHeader("Content-Type", "text/json");
	response.end(JSON.stringify(currentStocks));
}

function doRemoveCurrentStock(request, response)
{
	var symbol = request.query.symbol.toLowerCase();

	var ndx = currentStocks.indexOf(symbol);
	currentStocks.splice(ndx, 1);

	response.setHeader("Content-Type", "text/json");
	response.end(JSON.stringify({ success: true }));

	syncClients();
}

function doAddNewStock(request, response)
{
	var symbol = request.query.symbol.toLowerCase();
	currentStocks.push(symbol);
	response.setHeader("Content-Type", "text/json");
	response.end(JSON.stringify({ success: true }));

	syncClients();
}

function syncClients()
{
	io.emit("notification", { message: "do sync" });
}
